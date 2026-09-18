import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
export const WORLD_ART = {
  nebulosa: require('../assets/worlds/nebulosa-village.png'),
  asteroidi: require('../assets/worlds/asteroidi-village.png'),
  buconero: require('../assets/worlds/buconero-village.png'),
  supernova: require('../assets/worlds/supernova-village.png'),
};
const wrap = (x, span) => ((x % span) + span) % span;

export function WorldScene({ world, offset, width, height }) {
  const tileWidth = Math.max(width, height * 2 / 3);
  const phase = (offset * (world.id === 'buconero' ? .18 : .1)) % (tileWidth * 2);
  return <View pointerEvents="none" style={{ position:'absolute', inset:0, overflow:'hidden' }}>
    {/* Alternating mirrored tiles meet at identical image edges, without a hard reset. */}
    {[0,1,2,3].map(i => <Image key={i} source={WORLD_ART[world.id]} resizeMode="cover" style={{ position:'absolute', left:i*tileWidth-phase, top:0, width:tileWidth+1, height, transform:[{scaleX:i%2 ? -1:1}] }} />)}
    <View style={{ position:'absolute', inset:0, backgroundColor:world.gameBg[0], opacity:.24 }} />
    {Array.from({length:18},(_,i) => <View key={i} style={{ position:'absolute', left:wrap(i*113-offset*(.28+i%3*.12),width+40)-20, top:70+(i*137)%(height-120), width:world.id==='supernova'?8:3, height:3, borderRadius:3, backgroundColor:world.id==='nebulosa'?'#efe0a0':world.id==='supernova'?'#ffb074':'#d6eced', opacity:.22+i%3*.13, transform:[{rotate:'-20deg'}] }} />)}
    <LinearGradient colors={['#00000050','transparent','transparent','#00000090']} locations={[0,.16,.75,1]} style={{ position:'absolute', inset:0 }} />
  </View>;
}
