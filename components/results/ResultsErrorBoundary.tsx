"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Guards the results dashboard against unexpected render errors (e.g. an edge
 * case in AI data the schema didn't anticipate) so a single bad field never
 * blanks the whole app.
 */
export class ResultsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for local debugging without leaking to end users.
    console.error("Results render error:", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorBanner
          title="Couldn't display this plan"
          message="Something went wrong rendering the plan. Please generate a new one."
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
