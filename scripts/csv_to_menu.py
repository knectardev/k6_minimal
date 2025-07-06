import csv, json, re, sys, argparse, pathlib

ICON_MAP = {
    'Higher Education': 'grad.svg',
    'Intranets & Portals': 'intranet.svg',
    'Web & iOS Apps': 'web.svg',
    'Informational': 'info.svg',
    'E-Commerce': 'money.svg',
    'Music & Art': 'music.svg',
}

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text[:60]


def normalize_category(raw: str) -> str:
    raw = raw.strip()
    lower = raw.lower()
    if lower.startswith('high'):
        return 'Higher Education'
    if lower.startswith('intranet'):
        return 'Intranets & Portals'
    if lower.startswith('web'):
        return 'Web & iOS Apps'
    if lower.startswith('inform'):
        return 'Informational'
    if lower.startswith('e-') or lower.startswith('ecommerce') or lower.startswith('e-commerce'):
        return 'E-Commerce'
    if lower.startswith('music'):
        return 'Music & Art'
    return raw.title()


def build_menu(csv_path: pathlib.Path) -> list:
    categories = {}
    with csv_path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row['Project Title'].strip()
            if not title:
                continue
            cat = normalize_category(row['Category'])
            item = {
                'label': title,
                'slug': slugify(title),
                'url': f"project.html?item={slugify(title)}",
                'projectTitle': title,
                'role': row.get('ROLE') or None,
                'budget': row.get('BUDGET') or None,
                'technology': row.get('TECHNOLOGY') or None,
                'designPartner': row.get('DESIGN PARTNER') or None,
                'designPartnerUrl': row.get('DESIGNER domain') or None,
                'projectUrl': row.get('DOMAIN') or None,
                'pageSummary': row.get('Description ') or None,
                'coverImage': 'assets/ycba.png',
                'sub_menu': 1,
            }
            categories.setdefault(cat, []).append(item)

    menu = [
        {
            'label': 'About',
            'icon': 'about.svg',
            'url': '#',
            'more': 0,
        }
    ]

    ORDER = [
        'Higher Education',
        'Intranets & Portals',
        'Web & iOS Apps',
        'Informational',
        'E-Commerce',
    ]
    for cat in ORDER:
        if cat in categories:
            menu.append({
                'label': cat,
                'icon': ICON_MAP.get(cat, 'info.svg'),
                'more': 1,
                'submenu': categories[cat],
            })
    # Blog Posts as its own static section (no CSV rows yet)
    menu.append({'label': 'Blog Posts', 'icon': 'hash.svg', 'more': 0, 'submenu': []})

    # Music & Art (after Blog Posts)
    if 'Music & Art' in categories:
        menu.append({
            'label': 'Music & Art',
            'icon': ICON_MAP['Music & Art'],
            'more': 1,
            'submenu': categories['Music & Art'],
        })

    # Resume at the bottom
    menu.append({'label': 'Resume', 'icon': 'work.svg', 'url': 'resume/resume.html', 'more': 0})
    return menu


def main():
    parser = argparse.ArgumentParser(description='Convert CSV to menu.json')
    parser.add_argument('csv', type=pathlib.Path, help='Path to project_data.csv')
    parser.add_argument('out', type=pathlib.Path, help='Path to output menu.json')
    args = parser.parse_args()
    menu = build_menu(args.csv)
    with args.out.open('w', encoding='utf-8') as f:
        json.dump(menu, f, indent=2)
    print(f'Converted {args.csv} -> {args.out} with {len(menu)} top-level categories.')

if __name__ == '__main__':
    main() 