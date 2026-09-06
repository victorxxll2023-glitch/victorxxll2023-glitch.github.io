"""Offline teaching examples. Synthetic fixtures, no network or filesystem changes."""
import hashlib
import json
from datetime import datetime
from pathlib import Path


def triage(events, threshold=5, window_seconds=60):
    """Flag successes preceded by failures for the same account/source in a window."""
    failures = {}
    findings = []
    for event in sorted(events, key=lambda item: item['time']):
        moment = datetime.fromisoformat(event['time'].replace('Z', '+00:00'))
        key = (event['user'], event['source'])
        recent = [time for time in failures.get(key, [])
                  if 0 <= (moment - time).total_seconds() <= window_seconds]
        if event['result'] == 'failed':
            recent.append(moment)
        elif event['result'] == 'accepted':
            if len(recent) >= threshold:
                findings.append({
                    'user': key[0], 'source': key[1],
                    'failures': len(recent),
                    'elapsed_seconds': int((moment - recent[0]).total_seconds()),
                    'decision': 'review_session_not_confirmed_intrusion'
                })
            recent = []
        failures[key] = recent
    return findings


def integrity(records):
    """Compare supplied strings only; path labels never become file operations."""
    result = []
    for record in records:
        before = hashlib.sha256(record['before'].encode('utf-8')).hexdigest()
        after = hashlib.sha256(record['after'].encode('utf-8')).hexdigest()
        result.append({'path': record['path'], 'before_sha256': before,
                       'after_sha256': after, 'changed': before != after})
    return result


if __name__ == '__main__':
    folder = Path(__file__).resolve().parent
    auth = json.loads((folder / 'auth-events.json').read_text(encoding='utf-8'))
    files = json.loads((folder / 'integrity-files.json').read_text(encoding='utf-8'))
    print(json.dumps({'synthetic_data': True, 'ssh': triage(auth),
                      'integrity': integrity(files)}, indent=2))
