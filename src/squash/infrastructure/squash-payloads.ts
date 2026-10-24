import type { RunInfo, TestCaseId, TestCaseState } from '../application/ports';
import { executionMarker, type ExecutionRole } from '../domain/execution-role';
import type { ProjectRun, TestExecutionResult } from '../domain/execution-result';
import { isSyncOwned, OWNERSHIP_MARKER } from '../domain/reference-label';
import { gherkinScript, stepsOf, TestCaseFormat } from '../domain/gherkin';
import type { TestCaseDefinition } from '../domain/test-case';
import {
  STATUS_BY_OUTCOME,
  TEST_CASE_TYPE_BY_FORMAT,
  type AddToTestPlanBody,
  type CreateCampaignBody,
  type CreateFolderBody,
  type CreateIterationBody,
  type LibraryParent,
  type CreateTestCaseBody,
  type ManagedFields,
  type TestCaseParent,
  type UpdateExecutionBody,
  type UpdateTestCaseBody,
} from './squash-wire';

/** Caps one error block so a huge stack cannot bloat the execution comment. */
const MAX_ERROR_LENGTH = 4000;
const MS_PER_SECOND = 1000;
/** Squash's built-in automation technology for Playwright (Administration › Automation). */
const AUTOMATION_TECHNOLOGY = 'Playwright';

const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;
const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Builds Squash TM request bodies. Rich-text fields (description, comment) are
 * HTML in Squash, so every value from a test is escaped here, in one place.
 */
export class SquashPayloadBuilder {
  createTestCase(definition: TestCaseDefinition, parent: TestCaseParent, label: string): CreateTestCaseBody {
    return {
      _type: TEST_CASE_TYPE_BY_FORMAT[TestCaseFormat.Gherkin],
      parent,
      ...toWire(this.desiredState(definition, undefined, label)),
      name: definition.name,
      script: gherkinScript(definition, definition.steps ?? []),
    };
  }

  /** Only the fields that differ from `current`; `undefined` when nothing does. */
  updateTestCase(
    current: TestCaseState,
    definition: TestCaseDefinition,
    label: string | undefined,
  ): UpdateTestCaseBody | undefined {
    const changes = changedFields(current, this.desiredState(definition, current, label));
    // Squash rejects a PATCH whose `_type` is not the case's own format.
    const type = TEST_CASE_TYPE_BY_FORMAT[current.format];
    return Object.keys(changes).length > 0 ? { _type: type, ...toWire(changes) } : undefined;
  }

  /**
   * What the test says the case should hold. Name, description and script are
   * only claimed on a case the sync owns, so pinning a hand-written Squash test
   * case never overwrites its text. Only a Gherkin case gets a script. Fields
   * the test leaves out stay as Squash has them.
   */
  private desiredState(
    definition: TestCaseDefinition,
    current: TestCaseState | undefined,
    label: string | undefined,
  ): Partial<TestCaseState> {
    const { fields } = definition;
    const ownsText = current === undefined || isSyncOwned(current.description);
    const isGherkin = current?.format === TestCaseFormat.Gherkin;
    return {
      ...(ownsText ? { name: definition.name, description: this.description(definition) } : {}),
      ...(ownsText && isGherkin
        ? { script: gherkinScript(definition, definition.steps ?? stepsOf(current.script)) }
        : {}),
      ...(label === undefined ? {} : { reference: label }),
      ...(fields.weight ? { weight: fields.weight } : {}),
      ...(fields.status ? { status: fields.status } : {}),
      ...(fields.nature ? { nature: fields.nature } : {}),
      ...(fields.type ? { type: fields.type } : {}),
      automatedTestTechnology: AUTOMATION_TECHNOLOGY,
      automatedTestReference: definition.automationReference,
    };
  }

  createIteration(name: string, description: string): CreateIterationBody {
    return { _type: 'iteration', name, description: `<p>${escapeHtml(description)}</p>` };
  }

  createFolder(library: 'test-case' | 'campaign', parent: LibraryParent, name: string): CreateFolderBody {
    return { _type: `${library}-folder`, name, parent };
  }

  createCampaign(parent: LibraryParent, name: string): CreateCampaignBody {
    return { _type: 'campaign', name, parent };
  }

  addToTestPlan(testCaseId: TestCaseId): AddToTestPlanBody {
    return { _type: 'iteration-test-plan-item', test_case: { _type: 'test-case', id: testCaseId } };
  }

  updateExecution(result: TestExecutionResult, run: RunInfo, role: ExecutionRole): UpdateExecutionBody {
    return {
      _type: 'execution',
      execution_status: STATUS_BY_OUTCOME[result.outcome],
      comment: this.comment(result, run, role),
    };
  }

  private description(definition: TestCaseDefinition): string {
    const tags = definition.tags.length > 0 ? definition.tags.map(escapeHtml).join(', ') : 'none';
    return [
      OWNERSHIP_MARKER,
      `<p>Spec: <code>${escapeHtml(definition.file)}:${definition.line}</code></p>`,
      `<p>Tags: ${tags}</p>`,
    ].join('');
  }

  private comment(result: TestExecutionResult, run: RunInfo, role: ExecutionRole): string {
    const runs = result.runs.map(projectRun => `<li>${describeRun(projectRun)}</li>`).join('');
    const errors = result.runs.flatMap(projectRun =>
      projectRun.errors.map(
        error =>
          `<p><code>${escapeHtml(projectRun.project)}</code></p>` +
          `<pre>${escapeHtml(stripAnsi(error.stack ?? error.message).slice(0, MAX_ERROR_LENGTH))}</pre>`,
      ),
    );
    return [
      `<p>${executionMarker(role)}</p>`,
      `<p>Playwright run <strong>${escapeHtml(run.name)}</strong>: ${result.outcome}</p>`,
      `<ul>${runs}</ul>`,
      `<p>Spec: <code>${escapeHtml(result.testCase.file)}:${result.testCase.line}</code></p>`,
      ...errors,
    ].join('');
  }
}

function changedFields(current: TestCaseState, desired: Partial<TestCaseState>): Partial<TestCaseState> {
  // Every TestCaseState value is a string or null, so `!==` is a complete comparison.
  const changed = Object.entries(desired).filter(([field, value]) => current[field as keyof TestCaseState] !== value);
  return Object.fromEntries(changed);
}

function toWire(state: Partial<TestCaseState>): Partial<ManagedFields> {
  return {
    ...(state.name === undefined ? {} : { name: state.name }),
    ...(state.description === undefined ? {} : { description: state.description }),
    ...(state.reference === undefined ? {} : { reference: state.reference }),
    ...(state.weight === undefined ? {} : { importance: state.weight }),
    ...(state.status === undefined ? {} : { status: state.status }),
    ...(state.nature === undefined ? {} : { nature: { code: state.nature } }),
    ...(state.type === undefined ? {} : { type: { code: state.type } }),
    ...(typeof state.automatedTestTechnology === 'string'
      ? { automated_test_technology: state.automatedTestTechnology }
      : {}),
    ...(typeof state.automatedTestReference === 'string'
      ? { automated_test_reference: state.automatedTestReference }
      : {}),
    ...(typeof state.script === 'string' ? { script: state.script } : {}),
  };
}

function describeRun(run: ProjectRun): string {
  const seconds = (run.durationMs / MS_PER_SECOND).toFixed(1);
  const attempts = run.attempts > 1 ? `, ${run.attempts} attempts` : '';
  return `<code>${escapeHtml(run.project)}</code>: ${run.outcome} in ${seconds} s${attempts}`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, char => HTML_ENTITIES[char] ?? char);
}

function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE, '');
}
