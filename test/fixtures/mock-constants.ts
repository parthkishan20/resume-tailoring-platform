// These values must match backend/app/simulator.py MOCK_* constants exactly.
// If a test fails because values don't match, update these to match the simulator.

export const MOCK_CHAT_RESPONSE =
  "I understand. Here's what I can help you with: editing your master resume, " +
  "generating a tailored resume, or evaluating a resume against a job description.";
export const MOCK_RESUME_NAME_FRAGMENT = "Mock User"; // appears in generated resume
export const MOCK_EVALUATION_SCORE = 72;
export const MOCK_MISSING_KEYWORD = "Kubernetes";
export const MOCK_MATCHED_KEYWORD = "Python";
