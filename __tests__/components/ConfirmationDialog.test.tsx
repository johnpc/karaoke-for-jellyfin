import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmationDialog } from "@/components/mobile/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders when open", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onClose={mockOnClose}
      />,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        title="Test Title"
        message="Test message"
        onClose={mockOnClose}
      />,
    );

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onClose={mockOnClose}
      />,
    );

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("auto-closes after specified delay", async () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onClose={mockOnClose}
        autoCloseDelay={1000}
      />,
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not auto-close when autoCloseDelay is 0", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onClose={mockOnClose}
        autoCloseDelay={0}
      />,
    );

    jest.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("renders success type with correct styling", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Success"
        message="Operation successful"
        onClose={mockOnClose}
        type="success"
      />,
    );

    // Look for the main dialog container with the background color
    const dialog = screen.getByText("Success").closest(".bg-green-50");
    expect(dialog).toBeInTheDocument();
  });

  it("renders error type with correct styling", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title="Error"
        message="Operation failed"
        onClose={mockOnClose}
        type="error"
      />,
    );

    // Look for the main dialog container with the background color
    const dialog = screen.getByText("Error").closest(".bg-red-50");
    expect(dialog).toBeInTheDocument();
  });
});
