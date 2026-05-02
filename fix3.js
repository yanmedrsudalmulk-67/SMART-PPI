const fs = require('fs');
const glob = require('glob');
const files = glob.sync('app/dashboard/input/**/page.tsx');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const saveOrig = `      if (editObserverId) {
        const { error } = await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        if (error) throw error;
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (error) throw error;
        if (data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }`;

  const saveNew = `      if (editObserverId) {
        const { error } = await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        if (error && error.code !== '42P01') throw error;
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (error && error.code !== '42P01') throw error;
        if (data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }`;

  const delOrig = `      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error) throw error;`;
  
  const delNew = `      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error && error.code !== '42P01') throw error;`;

  if (content.includes(saveOrig)) {
    content = content.replace(saveOrig, saveNew);
    changed = true;
  }
  if (content.includes(delOrig)) {
    content = content.replace(delOrig, delNew);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Updated ' + count + ' files');
