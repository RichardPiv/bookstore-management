import LoginForm from "@/components/login/LoginForm";
import LoginPanelHeader from "@/components/login/LoginPanelHeader";
import LoginStatusFooter from "@/components/login/LoginStatusFooter";

export default function LoginPage() {
  return (
    <>
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center blur-md transition-all duration-1000"
          style={{ backgroundImage: "url(/img/home_hero.jpg)" }}
          role="img"
          aria-label="Bibliothèque ancienne en fond flouté"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="login-chiaroscuro absolute inset-0 z-10" />
        <div className="login-scanline absolute inset-0 z-20 opacity-30" />
      </div>

      <main className="relative z-30 w-full max-w-md px-6">
        <div className="login-rpg-panel relative p-10 shadow-2xl">
          <div className="login-rpg-panel-inner" aria-hidden />
          <LoginPanelHeader />
          <LoginForm />
          <footer className="mt-8 text-center">
            <p className="font-body text-[14px] text-outline/80 italic">
              &ldquo;Les secrets du passé ne sont révélés qu&apos;aux esprits
              préparés.&rdquo;
            </p>
          </footer>
        </div>
      </main>

      <LoginStatusFooter />
    </>
  );
}
