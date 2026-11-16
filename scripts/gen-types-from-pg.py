import subprocess, json, sys
url=sys.argv[1]
def q(sql):
    out=subprocess.check_output(['psql',url,'-At','-c',f"select coalesce(json_agg(t),'[]') from ({sql}) t"]).decode()
    return json.loads(out)
enums={}
for r in q("select t.typname as name, e.enumlabel as label from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' order by t.typname, e.enumsortorder"):
    enums.setdefault(r['name'],[]).append(r['label'])
cols=q("""select c.table_name, c.column_name, c.is_nullable, c.column_default, c.data_type, c.udt_name, c.is_identity, c.is_generated, c.ordinal_position
from information_schema.columns c join information_schema.tables t on t.table_name=c.table_name and t.table_schema=c.table_schema
where c.table_schema='public' and t.table_type='BASE TABLE' order by c.table_name, c.ordinal_position""")
def ts(udt):
    arr=udt.startswith('_')
    b=udt[1:] if arr else udt
    m={'uuid':'string','text':'string','varchar':'string','date':'string','time':'string','timestamptz':'string','timestamp':'string',
       'int2':'number','int4':'number','int8':'number','numeric':'number','float8':'number','bool':'boolean','jsonb':'Json','json':'Json','citext':'string'}
    if b in enums: t=f'Database["public"]["Enums"]["{b}"]'
    else: t=m[b]
    return f'{t}[]' if arr else t
tables={}
for c in cols: tables.setdefault(c['table_name'],[]).append(c)
o=[]
o.append('// Generated from the local migrations by introspecting PostgreSQL.\n// Regenerate against a live project with:\n//   npx supabase gen types typescript --local > src/types/database.ts\n')
o.append('export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n')
o.append('export type Database = {\n  __InternalSupabase: { PostgrestVersion: "12" };\n  public: {\n    Tables: {')
for tn in sorted(tables):
    o.append(f'      {tn}: {{')
    for kind in ['Row','Insert','Update']:
        o.append(f'        {kind}: {{')
        for c in tables[tn]:
            t=ts(c['udt_name']); nul=c['is_nullable']=='YES'
            tt=t+(' | null' if nul else '')
            if kind=='Row': o.append(f"          {c['column_name']}: {tt};")
            else:
                if c['is_identity']=='YES' and kind=='Insert':
                    o.append(f"          {c['column_name']}?: never;"); continue
                opt = kind=='Update' or nul or c['column_default'] is not None
                o.append(f"          {c['column_name']}{'?' if opt else ''}: {tt};")
        o.append('        };')
    o.append('        Relationships: [];\n      };')
o.append('    };\n    Views: { [_ in never]: never };\n    Functions: {')
fns=q("""select p.proname as name, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as res
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prorettype <> 'trigger'::regtype order by 1""")
def argts(s):
    s=s.strip()
    if s.startswith('timestamp with time zone') : return 'string'
    return ts({'uuid':'uuid','text':'text','integer':'int4','boolean':'bool','bigint':'int8'}.get(s.split()[0],s.split()[0]))
for f in fns:
    if f['name'] in ('set_updated_at',): continue
    args=[a.strip() for a in f['args'].split(',') if a.strip()]
    parts=[]
    for a in args:
        d=' DEFAULT ' in a
        a0=a.split(' DEFAULT ')[0]
        nm,ty=a0.split(' ',1)
        parts.append(f"{nm}{'?' if d else ''}: {argts(ty)}")
    res=f['res']
    if res.startswith('TABLE('):
        inner=res[6:-1]; fs=[]
        for x in inner.split(','):
            nm,ty=x.strip().split(' ',1); fs.append(f'{nm}: {argts(ty)}')
        r='{ '+'; '.join(fs)+' }[]'
    else: r=argts(res)
    a='{ '+'; '.join(parts)+' }' if parts else 'Record<PropertyKey, never>'
    o.append(f"      {f['name']}: {{ Args: {a}; Returns: {r} }};")
o.append('    };\n    Enums: {')
for e,v in enums.items(): o.append(f'      {e}: '+' | '.join(json.dumps(x) for x in v)+';')
o.append('    };\n    CompositeTypes: { [_ in never]: never };\n  };\n};\n')
o.append('type PublicSchema = Database["public"];\nexport type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];\nexport type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];\nexport type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];\nexport type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];')
print('\n'.join(o))
