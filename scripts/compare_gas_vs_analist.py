#!/usr/bin/env python3
import csv, json, os, sys
from pathlib import Path

BASE = Path('/home/szymon/projects/google-sheets-form-webapp-test')
ANALIST = BASE / 'analistData'
GAS = BASE / 'tmp_gas_data'

report_lines = []

def load_json_first_array(path: Path):
    with path.open('r', encoding='utf-8') as f:
        data = json.load(f)
    # Prefer explicit arrays if present
    for key in ['data', 'tasks', 'sessions', 'subjects', 'categories']:
        if isinstance(data, dict) and key in data and isinstance(data[key], list):
            return data[key]
    # Fallback if the root is already an array
    if isinstance(data, list):
        return data
    return []

def read_csv(path: Path):
    with path.open('r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return rows

def norm_bool(v):
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    s = str(v).strip().lower()
    if s in ('true', 'yes', '1'): return True
    if s in ('false', 'no', '0', ''): return False
    return s  # return original if unknown

def norm_str(v):
    if v is None:
        return ''
    # Preserve exact text for comparison but cast numbers to string
    return str(v)

def compare_sets(name, csv_rows, gas_rows, field_map, ignore_fields=None):
    ignore_fields = set(ignore_fields or [])
    # Build normalized tuples for comparison
    def row_to_tuple(row, mapping, is_csv):
        items = []
        for out_key, src_key in mapping.items():
            if out_key in ignore_fields:
                continue
            val = row.get(src_key, '') if is_csv else row.get(src_key, '')
            if out_key in ('active',):
                items.append((out_key, norm_bool(val)))
            else:
                items.append((out_key, norm_str(val)))
        return tuple(items)

    csv_set = set(row_to_tuple(r, field_map, True) for r in csv_rows if any(r.values()))
    gas_set = set(row_to_tuple(r, field_map, False) for r in gas_rows if isinstance(r, dict) and any(r.values()))

    only_in_csv = csv_set - gas_set
    only_in_gas = gas_set - csv_set

    report_lines.append(f'== {name} ==')
    report_lines.append(f'CSV count: {len(csv_set)}, GAS count: {len(gas_set)}')
    if not only_in_csv and not only_in_gas:
        report_lines.append('MATCH: Data sets are identical (for compared fields).')
    else:
        if only_in_csv:
            report_lines.append(f'Only in CSV ({len(only_in_csv)}): sample -> {list(only_in_csv)[:3]}')
        if only_in_gas:
            report_lines.append(f'Only in GAS ({len(only_in_gas)}): sample -> {list(only_in_gas)[:3]}')
    report_lines.append('')

# Subjects
subjects_csv = read_csv(ANALIST / 'Matura - Subjects.csv')
subjects_gas = load_json_first_array(GAS / 'subjects.json')
compare_sets(
    'Subjects',
    subjects_csv,
    subjects_gas,
    field_map={
        'subject_name': 'subject_name',
        'color': 'color',
        'icon': 'icon',
        'active': 'active'
    }
)

# Categories
categories_csv = read_csv(ANALIST / 'Matura - Categories.csv')
categories_gas = load_json_first_array(GAS / 'categories.json')
compare_sets(
    'Categories',
    categories_csv,
    categories_gas,
    field_map={
        'category_name': 'category_name',
        'subject_name': 'subject_name',
        'difficulty': 'difficulty',
        'active': 'active'
    }
)

# StudyTasks
studytasks_csv = read_csv(ANALIST / 'Matura - StudyTasks.csv')
studytasks_gas = load_json_first_array(GAS / 'study_tasks.json')
# Map exact headers; the CSV has a column literally named 'W szkole'
study_tasks_field_map = {
    'task_id': 'task_id',
    'task_name': 'task_name',
    'description': 'description',
    'categories': 'categories',
    'correctly_completed': 'correctly_completed',
    'start_time': 'start_time',
    'end_time': 'end_time',
    'W szkole': 'W szkole',
    'subject': 'subject',
    'session_id': 'session_id',
}
compare_sets('StudyTasks', studytasks_csv, studytasks_gas, study_tasks_field_map)

# StudySessions
studysessions_csv = read_csv(ANALIST / 'Matura - StudySessions.csv')
studysessions_gas = load_json_first_array(GAS / 'study_sessions.json')
# CSV has extra 'date' column that GAS does not expose; ignore it in comparison
study_sessions_field_map = {
    'session_id': 'session_id',
    'start_time': 'start_time',
    'end_time': 'end_time',
    'duration_minutes': 'duration_minutes',
    'total_tasks': 'total_tasks',
    'correct_tasks': 'correct_tasks',
    'accuracy_percentage': 'accuracy_percentage',
    'notes': 'notes',
}
compare_sets('StudySessions', studysessions_csv, studysessions_gas, study_sessions_field_map)

print('\n'.join(report_lines))
