console.log("[MONJARO LIVE] 1-second navigation diagnostics");
Java.perform(function(){
var Binding=Java.use("com.yandex.mapkit.navigation.automotive.internal.NavigationBinding");
var List=Java.use("java.util.List");
function field(obj,name){var cls=obj.getClass();while(cls!==null){try{var f=cls.getDeclaredField(name);f.setAccessible(true);return f.get(obj);}catch(e){cls=cls.getSuperclass();}}throw Error("Missing field "+name);}
function reflect0(obj,name){return obj.getClass().getMethod(name,Java.array("java.lang.Class",[])).invoke(obj,Java.array("java.lang.Object",[]));}
var found=false, binding=null, busy=false, ticks=0;
var StrictMode=Java.use("android.os.StrictMode");
var DatagramSocket=Java.use("java.net.DatagramSocket");
var DatagramPacket=Java.use("java.net.DatagramPacket");
var InetAddress=Java.use("java.net.InetAddress");
var JString=Java.use("java.lang.String");
var socket=DatagramSocket.$new();
var destination=InetAddress.getByName("127.0.0.1");
function sendUdp(action,meters,street){
  try{
    var payload=JSON.stringify({type:"monjaro_navigation",action:action,distance_m:meters,street:street,timestamp:Date.now()});
    var bytes=JString.$new(payload).getBytes("UTF-8");
    var oldPolicy=StrictMode.getThreadPolicy();
    try{StrictMode.setThreadPolicy(Java.use("android.os.StrictMode$ThreadPolicy$Builder").$new().permitAll().build());socket.send(DatagramPacket.$new(bytes,bytes.length,destination,49557));}
    finally{StrictMode.setThreadPolicy(oldPolicy);}
    console.log("[UDP SENT] "+payload);
  }catch(e){console.log("[UDP ERROR] "+e);}
}
function sample(){if(busy||!binding)return;busy=true;Java.scheduleOnMainThread(function(){try{
var guidance=reflect0(binding,"getGuidance");if(!guidance){console.log("[HUD] no guidance");return;}
var windshield=reflect0(guidance,"getWindshield");if(!windshield)return;
var moves=reflect0(windshield,"getManoeuvres");if(!moves)return;
var list=Java.cast(moves,List);if(list.size()===0){console.log("[HUD] no upcoming manoeuvre");return;}
var annotationD=reflect0(list.get(0),"getAnnotation");
var actionD=String(reflect0(annotationD,"getAction"));
var streetD=String(reflect0(annotationD,"getToponym"));

            try {
              var routeD=reflect0(guidance,"getCurrentRoute");
              var geometryD=reflect0(routeD,"getGeometry");
              var pointsD=Java.cast(reflect0(geometryD,"getPoints"),List);
              var routePosD=reflect0(routeD,"getPosition");
              var segD=Number(reflect0(routePosD,"getSegmentIndex"));
              var fractionD=Number(reflect0(routePosD,"getSegmentPosition"));
              var maneuverD=reflect0(list.get(0),"getPosition");
              var targetD=reflect0(maneuverD,"getPoint");
              var latMethod="getLatitude", lonMethod="getLongitude";
              function coord(p){return [Number(reflect0(p,latMethod)),Number(reflect0(p,lonMethod))];}
              function hav(a,b){
                var rad=Math.PI/180, dlat=(b[0]-a[0])*rad, dlon=(b[1]-a[1])*rad;
                var x=Math.sin(dlat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlon/2)**2;
                return 12742000*Math.asin(Math.min(1,Math.sqrt(x)));
              }
              var nD=pointsD.size(), targetCoord=coord(targetD), bestD=Infinity,bestIndex=-1,bestT=0;
              for(var di=Math.max(0,Math.floor(segD));di<nD-1;di++){
                var a=coord(pointsD.get(di)),b=coord(pointsD.get(di+1));
                var cos=Math.cos((a[0]+b[0])*Math.PI/360);
                var dx=(b[1]-a[1])*cos,dy=b[0]-a[0];
                var tx=(targetCoord[1]-a[1])*cos,ty=targetCoord[0]-a[0];
                var denom=dx*dx+dy*dy;
                var t=denom>0?Math.max(0,Math.min(1,(tx*dx+ty*dy)/denom)):0;
                var projected=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
                var deviation=hav(projected,targetCoord);
                if(deviation<bestD){bestD=deviation;bestIndex=di;bestT=t;}
              }
              if(bestD>100) console.log("[MATCH WARNING] deviation="+bestD.toFixed(1)+"m");
              if(bestIndex<segD || (bestIndex===segD && bestT<fractionD)){console.log("[DISTANCE] manoeuvre behind current route position");}
              else if(bestD>100){console.log("[DISTANCE] target not reliably matched to route (deviation > 100 m)");}
              else {
                var distD=0;
                for(var dj=Math.floor(segD);dj<=bestIndex;dj++){
                  var len=hav(coord(pointsD.get(dj)),coord(pointsD.get(dj+1)));
                  if(dj===Math.floor(segD) && dj===bestIndex)distD+=len*(bestT-fractionD);
                  else if(dj===Math.floor(segD))distD+=len*(1-fractionD);
                  else if(dj===bestIndex)distD+=len*bestT;
                  else distD+=len;
                }
                console.log("[HUD] "+actionD+" | "+Math.round(distD)+" m | "+streetD);sendUdp(actionD,Math.round(distD),streetD);
              }
            }catch(e){console.log("[DISTANCE ERROR] "+e);}

}catch(e){console.log("[LIVE ERROR] "+e);}finally{busy=false;}});}
Java.choose("oa1",{onMatch:function(listener){if(found)return;found=true;try{var raw=field(field(field(listener,"a"),"e"),"a");binding=Java.retain(Java.cast(raw,Binding));console.log("[LIVE] binding ready");sample();}catch(e){console.log("[BINDING ERROR] "+e);}},onComplete:function(){if(!found)console.log("[LIVE] listener not found");}});
var timer=setInterval(function(){ticks++;if(ticks>=60){clearInterval(timer);try{socket.close();}catch(e){}console.log("[LIVE] 60 samples complete");return;}sample();},1000);
});
