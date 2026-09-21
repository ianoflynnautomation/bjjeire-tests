import { FooterSection } from '@ui/pages/sections/footer.section';
import { HeaderSection } from '@ui/pages/sections/header.section';
import { pageFixture } from './mock-fixture';
import { SupportModal } from '@ui/pages/support/bitcoin-support.modal';

export type { FooterSection, HeaderSection, SupportModal };

export const headerSectionFixture = pageFixture(HeaderSection);
export const footerSectionFixture = pageFixture(FooterSection);
export const supportModalFixture = pageFixture(SupportModal);
