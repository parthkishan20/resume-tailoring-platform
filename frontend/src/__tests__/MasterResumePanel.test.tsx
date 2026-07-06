import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import MasterResumePanel from "@/components/MasterResumePanel";
import { api } from "@/lib/api";

jest.mock("@/lib/api");
jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="yaml-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
jest.mock("@codemirror/lang-yaml", () => ({ yaml: () => ({}) }));

const mockResume = {
  id: 1, user_id: "default", yaml_content: "cv:\n  name: Test", updated_at: "2026-01-01",
};

test("renders save button and calls api.saveMasterResume on click", async () => {
  (api.saveMasterResume as jest.Mock).mockResolvedValue(mockResume);
  const onSave = jest.fn();
  render(<MasterResumePanel resume={mockResume} onSave={onSave} onDelete={jest.fn()} />);
  fireEvent.click(screen.getByTestId("save-master-resume"));
  await waitFor(() => expect(api.saveMasterResume).toHaveBeenCalledWith("cv:\n  name: Test"));
  expect(onSave).toHaveBeenCalledWith(mockResume);
});

test("yaml-editor testid is present", () => {
  (api.saveMasterResume as jest.Mock).mockResolvedValue(mockResume);
  render(<MasterResumePanel resume={mockResume} onSave={jest.fn()} onDelete={jest.fn()} />);
  // The wrapper div and the mocked CodeMirror textarea both carry data-testid
  expect(screen.getAllByTestId("yaml-editor").length).toBeGreaterThanOrEqual(1);
});
