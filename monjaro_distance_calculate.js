console.log("[MONJARO] Main-thread manoeuvres test");
Java.perform(function () {
  var Binding = Java.use("com.yandex.mapkit.navigation.automotive.internal.NavigationBinding");
  var Thread = Java.use("java.lang.Thread");
  function field(obj, name) {
    var cls = obj.getClass();
    while (cls !== null) {
      try {
        var f = cls.getDeclaredField(name);
        f.setAccessible(true);
        return f.get(obj);
      } catch (e) { cls = cls.getSuperclass(); }
    }
    throw new Error("Missing field: " + name);
  }
  function reflect0(obj, name) {
    var method = obj.getClass().getMethod(name, Java.array("java.lang.Class", []));
    return method.invoke(obj, Java.array("java.lang.Object", []));
  }
  var found = false;
  Java.choose("oa1", {
    onMatch: function (listener) {
      if (found) return;
      found = true;
      try {
        var raw = field(field(field(listener, "a"), "e"), "a");
        var binding = Java.retain(Java.cast(raw, Binding));
        console.log("[BINDING] FOUND");
        Java.scheduleOnMainThread(function () {
          try {
            console.log("[THREAD] " + Thread.currentThread().getName());
            console.log("[CALL] getGuidance");
            var guidance = reflect0(binding, "getGuidance");
            if (guidance === null) { console.log("[GUIDANCE] NULL"); return; }
            console.log("[GUIDANCE] " + guidance.getClass().getName());
            console.log("[CALL] getWindshield");
            var windshield = reflect0(guidance, "getWindshield");
            if (windshield === null) { console.log("[WINDSHIELD] NULL"); return; }
            console.log("[WINDSHIELD] " + windshield.getClass().getName());
            console.log("[CALL] getManoeuvres");
            var moves = reflect0(windshield, "getManoeuvres");
            if (moves === null) { console.log("[MANOEUVRES] NULL"); return; }
            var List = Java.use("java.util.List");
            var list = Java.cast(moves, List);
            var count = list.size();
            console.log("[MANOEUVRES COUNT] " + count);
            for (var i = 0; i < Math.min(count, 3); i++) {
              console.log("[MANOEUVRE " + i + "] " + list.get(i).getClass().getName());
            }
            if (count > 0) {
              var item = list.get(0);
              var methods = item.getClass().getMethods();
              console.log("[METHODS] UpcomingManoeuvre public methods:");
              for (var j = 0; j < methods.length; j++) {
                var m = methods[j];
                var name = m.getName().toString();
                if (name.indexOf("get") === 0 && name !== "getClass") {
                  console.log("[METHOD] " + m.toString());
                }
              }
            }
            if (count > 0) {
              var first = list.get(0);
              var cls = first.getClass();
              var names = ["getAnnotation", "getPosition"];
              for (var k = 0; k < names.length; k++) {
                try {
                  var method = cls.getMethod(names[k], Java.array("java.lang.Class", []));
                  var result = method.invoke(first, Java.array("java.lang.Object", []));
                  if (result === null) {
                    console.log("[" + names[k] + "] NULL");
                  } else {
                    console.log("[" + names[k] + "] " + result.getClass().getName());
                    var ms = result.getClass().getMethods();
                    for (var p = 0; p < ms.length; p++) {
                      var mn = ms[p].getName().toString();
                      if (mn.indexOf("get") === 0 && mn !== "getClass") {
                        console.log("[PROPERTY] " + ms[p].toString());
                      }
                    }
                  }
                } catch (err) { console.log("[ERROR " + names[k] + "] " + err); }
              }
            }
            if (count > 0) {
              var first = list.get(0);
              var annotation = reflect0(first, "getAnnotation");
              if (annotation !== null) {
                var names = ["getAction", "getDescriptionText", "getToponym", "getActionMetadata"];
                for (var q = 0; q < names.length; q++) {
                  try {
                    var val = reflect0(annotation, names[q]);
                    console.log("[VALUE " + names[q] + "] " + (val === null ? "NULL" : val.toString()));
                  } catch (err) { console.log("[ERROR " + names[q] + "] " + err); }
                }
              }
            }
            var gm = guidance.getClass().getMethods();
            console.log("[GUIDANCE DISTANCE METHODS]");
            for (var z = 0; z < gm.length; z++) {
              var s = gm[z].toString();
              if (/distance|position|route|progress/i.test(s) && /get[A-Z]/.test(s)) console.log("[GUIDANCE METHOD] " + s);
            }
            var wm = windshield.getClass().getMethods();
            console.log("[WINDSHIELD DISTANCE METHODS]");
            for (var w = 0; w < wm.length; w++) {
              var t = wm[w].toString();
              if (/distance|position|route|progress/i.test(t) && /get[A-Z]/.test(t)) console.log("[WINDSHIELD METHOD] " + t);
            }
            console.log("[CALL] getCurrentRoute on main thread");
            try {
              var route = reflect0(guidance, "getCurrentRoute");
              if (route === null) {
                console.log("[ROUTE] NULL");
              } else {
                console.log("[ROUTE] " + route.getClass().getName());
                var routeMethods = route.getClass().getMethods();
                for (var ri = 0; ri < routeMethods.length; ri++) {
                  var rm = routeMethods[ri].toString();
                  if (/get[A-Z]/.test(rm) && /geometry|section|distance|position|metadata|route|polyline|length/i.test(rm)) console.log("[ROUTE METHOD] " + rm);
                }
              }
            } catch (routeError) { console.log("[ROUTE ERROR] " + routeError); }
            console.log("[DISTANCE CALC]");
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
              console.log("[ROUTE MATCH] segment="+bestIndex+" fraction="+bestT.toFixed(5)+" deviation_m="+bestD.toFixed(1));
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
                console.log("[DISTANCE TO TURN METERS] "+Math.round(distD));
              }
            }catch(e){console.log("[DISTANCE ERROR] "+e);}
            console.log("[SUCCESS] Route inspection finished");
          } catch (e) { console.log("[ERROR] " + e); console.log("[STACK] " + e.stack); }
        });
      } catch (e) { console.log("[ERROR] " + e); }
    },
    onComplete: function () { console.log("[INSTANCES] " + (found ? "FOUND" : "NONE")); }
  });
  setTimeout(function () { console.log("[TEST COMPLETE]"); }, 10000);
});
