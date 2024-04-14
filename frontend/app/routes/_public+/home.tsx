import { Button } from "~/components/ui/button";

export default function Index() {
  return (
    <div className="flex flex-col gap-3">
      <h1>Coup de Pouce</h1>
      <Button variant={"primary"}>Créer un compte</Button>
    </div>
  );
}
