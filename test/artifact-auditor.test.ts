import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractRepositoryLinks,
  detectReasonableRequestFormulation,
  auditManuscriptArtifacts,
} from "../src/lib/artifact-auditor";

describe("Artifact & Reproducibility Auditor", () => {
  describe("extractRepositoryLinks", () => {
    it("extracts GitHub repository links and trims trailing punctuation", () => {
      const text = `
        Our complete code pipeline is available at https://github.com/alan-turing/crypto-benchmarks.
        Additional scripts: https://github.com/torvalds/linux, and model checkpoints.
      `;
      const links = extractRepositoryLinks(text);
      assert.equal(links.length, 2);
      assert.equal(links[0].platform, "github");
      assert.equal(links[0].ownerOrId, "alan-turing");
      assert.equal(links[0].repo, "crypto-benchmarks");
      assert.equal(links[0].url, "https://github.com/alan-turing/crypto-benchmarks");

      assert.equal(links[1].ownerOrId, "torvalds");
      assert.equal(links[1].repo, "linux");
    });

    it("extracts Zenodo records from URL and DOI formats", () => {
      const text = `
        Dataset deposited at https://zenodo.org/records/10839210.
        Supplementary tables can be accessed via 10.5281/zenodo.7891234.
      `;
      const links = extractRepositoryLinks(text);
      assert.equal(links.length, 2);
      assert.equal(links[0].platform, "zenodo");
      assert.equal(links[0].ownerOrId, "10839210");
      assert.equal(links[1].platform, "zenodo");
      assert.equal(links[1].ownerOrId, "7891234");
    });

    it("extracts OSF, Figshare, and HuggingFace repositories", () => {
      const text = `
        Preregistration: https://osf.io/abc12/
        Raw imaging: https://figshare.com/articles/98765432
        Pre-trained weights: https://huggingface.co/meta-llama/Llama-3-8b
      `;
      const links = extractRepositoryLinks(text);
      assert.equal(links.length, 3);
      assert.ok(links.some((l) => l.platform === "osf" && l.ownerOrId === "abc12"));
      assert.ok(links.some((l) => l.platform === "figshare" && l.ownerOrId === "98765432"));
      assert.ok(links.some((l) => l.platform === "huggingface" && l.ownerOrId === "meta-llama/Llama-3-8b"));
    });

    it("avoids duplicating repository URLs", () => {
      const text = `
        Code is at https://github.com/org/repo and also see https://github.com/org/repo.
      `;
      const links = extractRepositoryLinks(text);
      assert.equal(links.length, 1);
    });
  });

  describe("detectReasonableRequestFormulation", () => {
    it("detects non-compliant 'upon reasonable request' formulations", () => {
      assert.equal(detectReasonableRequestFormulation("The datasets generated during the current study are available from the corresponding author upon reasonable request."), true);
      assert.equal(detectReasonableRequestFormulation("Data is provided upon request."), true);
      assert.equal(detectReasonableRequestFormulation("All raw analysis files are shared upon reasonable request."), true);
      assert.equal(detectReasonableRequestFormulation("Code and logs accessible from authors upon request."), true);
    });

    it("returns false for compliant open data statements", () => {
      assert.equal(detectReasonableRequestFormulation("All raw data and code are publicly accessible at https://github.com/lab/repo."), false);
      assert.equal(detectReasonableRequestFormulation("Data deposited in Zenodo under DOI 10.5281/zenodo.123456."), false);
      assert.equal(detectReasonableRequestFormulation(""), false);
    });
  });

  describe("auditManuscriptArtifacts", () => {
    it("flags overall reproducibility risk as high when upon-request phrasing is used without open repositories", async () => {
      const text = "Data and materials are available from the author upon reasonable request.";
      const audit = await auditManuscriptArtifacts(text);
      assert.equal(audit.hasReasonableRequestWarning, true);
      assert.equal(audit.overallReproducibilityRisk, "high");
      assert.equal(audit.detectedLinks.length, 0);
      assert.ok(audit.summary.includes("Nature, PLOS, IEEE"));
    });

    it("returns appropriate summary and low or none risk when public repositories exist", async () => {
      const text = "All data are openly deposited at https://zenodo.org/records/10839210.";
      const audit = await auditManuscriptArtifacts(text);
      assert.equal(audit.detectedLinks.length, 1);
      assert.equal(audit.repoAudits.length, 1);
      assert.equal(audit.repoAudits[0].platform, "zenodo");
    });
  });
});
