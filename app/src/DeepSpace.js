import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { meteorPosition } from './meteors';
const wrap = (n, span) => ((n % span) + span) % span;
const STARS = Array.from({ length: 78 }, (_, i) => ({ x: (i * 137.508) % 997 / 997, y: (i * 83.71) % 991 / 991, layer: i % 3 }));

export function DeepSpace({ offset, width, height }) {
  return <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    {STARS.map((s,i) => <View key={i} style={{ position:'absolute', left:wrap(s.x * (width+30) - offset * [.12,.3,.65][s.layer], width+30)-15, top:60+s.y*(height-100), width:s.layer === 2 ? 7 : 2, height:s.layer === 0 ? 1 : 2, borderRadius:2, backgroundColor:s.layer === 1 ? '#a4dff6' : '#fff', opacity:[.25,.45,.75][s.layer] }} />)}
    {[0,1,2,3,4].map(i => <View key={i} style={{ position:'absolute', left:wrap(i*173-offset*.85,width+100)-50, top:height*(.18+i*.16), width:8+i*2, height:5+i, borderRadius:3, borderWidth:1, borderColor:'#8cc8d840', backgroundColor:'#244552', transform:[{rotate:`${i*53}deg`}], opacity:.4 }} />)}
    <LinearGradient colors={['transparent','#030911']} style={{ position:'absolute', bottom:0, height:130, width:'100%' }} />
  </View>;
}

export function MeteorField({ meteors, elapsed, width }) {
  return <View pointerEvents="none" style={{ position:'absolute', inset:0 }}>
    {meteors.map(m => {
      const p = meteorPosition(m, elapsed);
      if (!p.active) return <View key={m.id} style={{ position:'absolute', right:12, top:m.startY-22, alignItems:'flex-end' }}>
        <Text style={{ color:'#ffc78b', fontSize:10, fontWeight:'800', letterSpacing:1 }}>METEORA IN ARRIVO</Text>
        <View style={{ marginTop:5, width:width*.7, height:1, backgroundColor:'#ffbb7345' }} />
        <Text style={{ color:'#ffc78b', fontSize:20 }}>◁</Text>
      </View>;
      return <View key={m.id} style={{ position:'absolute', left:p.x-m.radius, top:p.y-m.radius, width:m.radius*2, height:m.radius*2, transform:[{rotate:`${Math.atan2(-m.vy,-m.vx)*180/Math.PI}deg`}] }}>
        <LinearGradient colors={['#ffce8ab0','#ff71484a','transparent']} start={{x:0,y:.5}} end={{x:1,y:.5}} style={{ position:'absolute', left:m.radius, top:-4, width:115, height:m.radius*2+8, borderRadius:30 }} />
        <View style={{ position:'absolute', inset:-6, borderRadius:30, backgroundColor:'#ff97532a' }} />
        <LinearGradient colors={['#fff0bb','#f5a15f','#79463f']} style={{ width:m.radius*2, height:m.radius*2, borderRadius:m.radius, borderWidth:2, borderColor:'#ffe0a7' }}>
          <View style={{ position:'absolute', left:7, top:7, width:9, height:7, borderRadius:5, backgroundColor:'#75483f70' }} />
        </LinearGradient>
      </View>;
    })}
  </View>;
}
