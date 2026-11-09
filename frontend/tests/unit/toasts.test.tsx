import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "../../src/contexts/ToastContext";

function ToastTestActions() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Salvo.", "success")}>Sucesso</button>
      <button onClick={() => showToast("Há agendamentos afetados.", "warning")}>
        Aviso
      </button>
      <button onClick={() => showToast("Não foi possível salvar.", "error")}>
        Erro
      </button>
    </div>
  );
}

describe("admin toasts", () => {
  it("renders success, warning, and error messages with accessible roles", () => {
    render(
      <ToastProvider>
        <ToastTestActions />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sucesso" }));
    fireEvent.click(screen.getByRole("button", { name: "Aviso" }));
    fireEvent.click(screen.getByRole("button", { name: "Erro" }));

    expect(
      screen.getByText("Salvo.").closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Há agendamentos afetados.").closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Não foi possível salvar.").closest('[role="alert"]'),
    ).toBeInTheDocument();
  });

  it("lets the user dismiss a toast", () => {
    render(
      <ToastProvider>
        <ToastTestActions />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sucesso" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));

    expect(screen.queryByText("Salvo.")).not.toBeInTheDocument();
  });
});
