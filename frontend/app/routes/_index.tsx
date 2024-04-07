import { Button } from "~/components/ui/button";
export default function Index() {
  return (
    <div className="flex flex-col gap-3">
      <h1>Coup de Pouce</h1>
      <Button variant={"primary"}>Créer un compte</Button>
      <Button variant={"secondary"}>Créer un compte</Button>
      <Button variant={"greenOutline"}>Créer un compte</Button>
      <Button variant={"redOutline"}>Créer un compte</Button>
      <Button variant={"blueOutline"}>Créer un compte</Button>
      <Button variant={"oauth"}>Créer un compte</Button>
    </div>
  );
}
