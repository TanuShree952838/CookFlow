import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DayContextForm } from "@/components/form/DayContextForm";

describe("DayContextForm", () => {
  it("renders the core fields and submit button", () => {
    render(<DayContextForm onSubmit={vi.fn()} isSubmitting={false} />);
    expect(screen.getByLabelText(/wake time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dinner time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily budget/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate my cooking plan/i })).toBeInTheDocument();
  });

  it("submits a valid form with parsed numbers", async () => {
    const onSubmit = vi.fn();
    render(<DayContextForm onSubmit={onSubmit} isSubmitting={false} />);
    fireEvent.click(screen.getByRole("button", { name: /generate my cooking plan/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const arg = onSubmit.mock.calls[0]![0];
    expect(typeof arg.budget).toBe("number");
    expect(typeof arg.servings).toBe("number");
    expect(arg.includeMeals.length).toBeGreaterThan(0);
  });

  it("blocks submission and shows an error for invalid budget", async () => {
    const onSubmit = vi.fn();
    render(<DayContextForm onSubmit={onSubmit} isSubmitting={false} />);
    fireEvent.change(screen.getByLabelText(/daily budget/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /generate my cooking plan/i }));
    await waitFor(() =>
      expect(screen.getByText(/greater than zero/i)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the button while submitting", () => {
    render(<DayContextForm onSubmit={vi.fn()} isSubmitting />);
    expect(screen.getByRole("button", { name: /planning your day/i })).toBeDisabled();
  });
});
