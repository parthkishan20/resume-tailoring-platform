// test/e2e/03-pdf-upload.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Scenario 3: PDF upload / import", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/master-resume").catch(() => {});
  });

  test("drag-and-drop PDF import triggers YAML extraction", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid=pdf-import-zone]")).toBeVisible();

    // Simulate file drop via input (Playwright doesn't support native drag-drop)
    // The PDF import zone has a hidden <input type="file"> — trigger it programmatically
    const minimalPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj\n" +
      "3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>>endobj\n" +
      "xref\n0 4\n0000000000 65535 f\r\n0000000009 00000 n\r\n" +
      "0000000058 00000 n\r\n0000000115 00000 n\r\n" +
      "trailer<</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF"
    );

    await page.locator("[data-testid=pdf-import-zone] input[type=file]").setInputFiles({
      name: "resume.pdf",
      mimeType: "application/pdf",
      buffer: minimalPdf,
    });

    // After import, YAML editor should appear (master resume was created)
    await expect(page.locator("[data-testid=yaml-editor]")).toBeVisible({ timeout: 15_000 });
  });
});
