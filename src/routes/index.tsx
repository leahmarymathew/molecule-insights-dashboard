import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => null,
  head: () => ({
    meta: [
      { title: "MolecuLab — Pharmaceutical Molecule Analytics" },
      {
        name: "description",
        content: "Analytics dashboard for pharmaceutical molecule opportunity screening.",
      },
    ],
  }),
});
