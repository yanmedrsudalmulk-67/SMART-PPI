const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/dashboard/input/**/page.tsx');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const deleteObserverRegex = /const deleteObserver = async \(id: string\) => \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n  \};/g;

  const newDeleteObserver = `const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      if (!id.startsWith('local-')) {
        await supabase.from('master_observers').delete().eq('id', id);
      }
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    } catch (err) {
      console.error('Delete observer fallback:', err);
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    }
  };`;

  if (content.match(deleteObserverRegex)) {
    content = content.replace(deleteObserverRegex, newDeleteObserver);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Fixed ' + count + ' delete functions');
