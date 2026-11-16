import { AppHeader, SimpleFooter } from "@/components/app/app-header";

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <>
      <AppHeader showNav={false} />
      {children}
      <SimpleFooter />
    </>
  );
}
