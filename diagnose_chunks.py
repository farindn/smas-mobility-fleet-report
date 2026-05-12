"""
Diagnostic script to analyze event counts per date chunk.
Run this separately to identify where events are being lost.
"""

import mygeotab
import getpass
import pytz
from datetime import datetime, timedelta
from collections import Counter

# Authentication
USERNAME = 'farinnugraha'
DATABASE = 'smasmobility'

password = getpass.getpass(prompt='MyGeotab Password: ')
api = mygeotab.API(USERNAME, password, DATABASE)
api.authenticate()
print(f'Connected to: {DATABASE}\n')

# Date range (same as notebook)
TZ = pytz.timezone('Asia/Jakarta')
local_start = datetime(2026, 1, 1)
local_end   = datetime(2026, 1, 31)

start_utc = TZ.localize(datetime.combine(local_start, datetime.min.time())).astimezone(pytz.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
end_utc   = TZ.localize(datetime.combine(local_end,   datetime.max.time())).astimezone(pytz.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')

print(f'Date range: {local_start.date()} to {local_end.date()}')
print(f'UTC range: {start_utc} to {end_utc}\n')

def diagnose_chunks(api, rule_id, rule_name, chunk_days=7):
    start_dt = datetime.strptime(start_utc, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=pytz.UTC)
    end_dt   = datetime.strptime(end_utc, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=pytz.UTC)

    all_events  = []
    chunk_num   = 0
    chunk_start = start_dt

    while chunk_start < end_dt:
        chunk_end   = min(chunk_start + timedelta(days=chunk_days), end_dt)
        chunk_to_dt = chunk_end - timedelta(seconds=1) if chunk_end < end_dt else chunk_end
        chunk_num  += 1

        batch = api.call('Get', typeName='ExceptionEvent', search={
            'ruleSearch': {'id': rule_id},
            'fromDate': chunk_start.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'toDate':   chunk_to_dt.strftime('%Y-%m-%dT%H:%M:%SZ'),
        })
        all_events.extend(batch or [])
        print(f'Chunk {chunk_num}: {chunk_start.date()} to {chunk_end.date()} = {len(batch or [])} events')
        chunk_start = chunk_end

    total    = len(all_events)
    id_counts = Counter(e['id'] for e in all_events)
    dupes     = {eid: cnt for eid, cnt in id_counts.items() if cnt > 1}
    unique    = len(id_counts)

    print(f'\nTotal raw     : {total}')
    print(f'Unique IDs    : {unique}')
    print(f'Duplicate IDs : {len(dupes)} (these appear more than once)')
    if dupes:
        print(f'Sample dupes  : {list(dupes.items())[:5]}')

    return total, unique

print('='*60)
print('IDLING EVENTS')
print('='*60)
idle_total, idle_unique = diagnose_chunks(api, 'RuleIdlingId', 'Idling')

print()
print('='*60)
print('SPEEDING EVENTS')
print('='*60)
speed_total, speed_unique = diagnose_chunks(api, 'RulePostedSpeedingId', 'Speeding')

print()
print('='*60)
print('SUMMARY')
print('='*60)
print(f'{"":30} {"Raw":>8} {"Unique":>8}')
print(f'{"Idling":30} {idle_total:>8} {idle_unique:>8}')
print(f'{"Speeding":30} {speed_total:>8} {speed_unique:>8}')
print(f'\nMYG UI:  Idling=25,483  Speeding=5,097')
print(f'\nIdling diff (raw vs MYG)   : {idle_total  - 25483:+d}')
print(f'Idling diff (unique vs MYG): {idle_unique - 25483:+d}')
