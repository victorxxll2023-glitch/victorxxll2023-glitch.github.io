import json
import unittest
from pathlib import Path
from analyze import triage, integrity


class DemoTests(unittest.TestCase):
    def setUp(self):
        folder = Path(__file__).parent
        self.events = json.loads((folder / 'auth-events.json').read_text())
        self.files = json.loads((folder / 'integrity-files.json').read_text())

    def test_expected_synthetic_finding(self):
        finding, = triage(self.events)
        self.assertEqual((finding['failures'], finding['elapsed_seconds']), (6, 48))

    def test_window_and_account_isolation(self):
        self.assertEqual(triage(self.events, window_seconds=10), [])
        self.events[6]['user'] = 'other'
        self.assertEqual(triage(self.events), [])

    def test_no_failures_and_out_of_order(self):
        self.assertEqual(triage([self.events[-1]]), [])
        self.assertEqual(triage(list(reversed(self.events))), triage(self.events))

    def test_success_resets_sequence(self):
        self.events.append(dict(self.events[6], time='2026-01-01T09:00:50Z'))
        self.assertEqual(len(triage(self.events)), 1)

    def test_integrity(self):
        self.assertEqual([row['changed'] for row in integrity(self.files)], [True, False])
        self.assertEqual(integrity([]), [])


if __name__ == '__main__':
    unittest.main()
