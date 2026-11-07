'use strict';

/**
 * Shows the test coverage of the frontend (ITACR-62): the percentage of covered lines, statements, functions, and branches
 * from the `json-summary` report of Vitest. In GitHub Actions it is also added to the summary of the job.
 *
 * Usage: node coverage-summary.cjs <coverage-summary.json>
 */

const fs = require('node:fs');

function render(total) {
  const row = (label, metric) =>
    `| ${label} | ${metric.covered} | ${metric.total} | ${metric.pct.toFixed(1)}% |`;
  return [
    `### Test coverage: ${total.lines.pct.toFixed(1)}% of the lines`,
    '',
    '| Metric | Covered | Total | Coverage |',
    '| --- | ---: | ---: | ---: |',
    row('Lines', total.lines),
    row('Statements', total.statements),
    row('Functions', total.functions),
    row('Branches', total.branches),
    '',
  ].join('\n');
}

function main() {
  const file = process.argv[2] ?? 'coverage/itacr-frontend/coverage-summary.json';
  if (!fs.existsSync(file)) {
    console.log(`::warning title=No coverage report::There is no ${file}.`);
    return;
  }

  const markdown = render(JSON.parse(fs.readFileSync(file, 'utf8')).total);
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
}

if (require.main === module) {
  main();
}

module.exports = { render };
