#!/usr/bin/env node

/**
 * CRAP Score Analysis
 * Formula: CRAP = complexity^2 * (1 - coverage)^3 + complexity
 * Threshold: 15 per function
 *
 * Uses coverage-final.json from Istanbul coverage output
 * and estimates cyclomatic complexity from branch coverage data.
 */

const fs = require("fs");
const path = require("path");

const CRAP_THRESHOLD = 15;
const coveragePath = path.resolve(__dirname, "../coverage/coverage-final.json");

function calculateCrap(complexity, coverage) {
  const uncovered = 1 - coverage;
  return Math.pow(complexity, 2) * Math.pow(uncovered, 3) + complexity;
}

function estimateComplexity(fnCoverage) {
  // Estimate cyclomatic complexity from branch data
  // Each branch point adds 1 to complexity, base is 1
  if (!fnCoverage.branchMap) return 1;
  return Object.keys(fnCoverage.branchMap).length + 1;
}

function getFunctionCoverage(fileCoverage, fnName) {
  const fnData = fileCoverage.f;
  const fnMap = fileCoverage.fnMap;

  if (!fnMap || !fnData) return 1;

  for (const [key, fn] of Object.entries(fnMap)) {
    if (fn.name === fnName || fn.loc) {
      const hits = fnData[key] || 0;
      return hits > 0 ? 1 : 0;
    }
  }
  return 0;
}

function getStatementCoverageForFunction(fileCoverage, fnEntry) {
  const stmtMap = fileCoverage.statementMap;
  const stmtData = fileCoverage.s;

  if (!stmtMap || !stmtData || !fnEntry.loc) return 1;

  const fnStart = fnEntry.loc.start.line;
  const fnEnd = fnEntry.loc.end.line;

  let coveredStatements = 0;
  let totalStatements = 0;

  for (const [key, stmt] of Object.entries(stmtMap)) {
    if (stmt.start.line >= fnStart && stmt.end.line <= fnEnd) {
      totalStatements++;
      if (stmtData[key] > 0) {
        coveredStatements++;
      }
    }
  }

  if (totalStatements === 0) return 1;
  return coveredStatements / totalStatements;
}

function getBranchComplexityForFunction(fileCoverage, fnEntry) {
  const branchMap = fileCoverage.branchMap;

  if (!branchMap || !fnEntry.loc) return 1;

  const fnStart = fnEntry.loc.start.line;
  const fnEnd = fnEntry.loc.end.line;

  let branchCount = 0;
  for (const branch of Object.values(branchMap)) {
    if (
      branch.loc &&
      branch.loc.start.line >= fnStart &&
      branch.loc.end.line <= fnEnd
    ) {
      branchCount++;
    }
  }

  return branchCount + 1;
}

function analyze() {
  if (!fs.existsSync(coveragePath)) {
    console.error("Coverage file not found at:", coveragePath);
    console.error("Run tests with coverage first: npm run test:coverage");
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf-8"));
  const violations = [];
  let totalFunctions = 0;
  let passingFunctions = 0;

  for (const [filePath, fileCoverage] of Object.entries(coverage)) {
    const fnMap = fileCoverage.fnMap;
    if (!fnMap) continue;

    const relativePath = path.relative(process.cwd(), filePath);

    for (const [key, fn] of Object.entries(fnMap)) {
      totalFunctions++;

      const complexity = getBranchComplexityForFunction(fileCoverage, fn);
      const fnCoverage = getStatementCoverageForFunction(fileCoverage, fn);
      const crap = calculateCrap(complexity, fnCoverage);

      if (crap > CRAP_THRESHOLD) {
        violations.push({
          file: relativePath,
          function: fn.name || `anonymous@${fn.loc.start.line}`,
          line: fn.loc.start.line,
          complexity,
          coverage: (fnCoverage * 100).toFixed(1),
          crap: crap.toFixed(2),
        });
      } else {
        passingFunctions++;
      }
    }
  }

  console.log("\n=== CRAP Score Analysis ===\n");
  console.log(`Total functions analyzed: ${totalFunctions}`);
  console.log(`Passing (CRAP <= ${CRAP_THRESHOLD}): ${passingFunctions}`);
  console.log(`Violations (CRAP > ${CRAP_THRESHOLD}): ${violations.length}`);

  if (violations.length > 0) {
    console.log("\n--- Violations ---\n");
    violations
      .sort((a, b) => parseFloat(b.crap) - parseFloat(a.crap))
      .forEach(v => {
        console.log(
          `  ${v.file}:${v.line} - ${v.function}` +
            `  (CRAP: ${v.crap}, complexity: ${v.complexity}, coverage: ${v.coverage}%)`
        );
      });
    console.log(
      `\n${violations.length} function(s) exceed CRAP threshold of ${CRAP_THRESHOLD}`
    );
    process.exit(1);
  } else {
    console.log("\nAll functions pass CRAP threshold. Great job!");
    process.exit(0);
  }
}

analyze();
