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
            console.log("[POSITION INSPECTION]");
            try {
              var route2 = reflect0(guidance, "getCurrentRoute");
              if (route2 !== null) {
                for (var pname of ["getPosition", "getRoutePosition"]) {
                  try {
                    var pos = reflect0(route2, pname);
                    console.log("[ROUTE " + pname + "] " + (pos === null ? "NULL" : pos.toString()));
                    if (pos !== null) {
                      for (var pm of pos.getClass().getMethods()) {
                        if (/get[A-Z]/.test(pm.toString()) && /point|segment|fraction|position|distance/i.test(pm.toString())) {
                          console.log("[ROUTE POSITION METHOD] " + pm.toString());
                          if (pm.getParameterTypes().length === 0) {
                            try { console.log("[ROUTE POSITION VALUE] " + pm.getName() + "=" + reflect0(pos, pm.getName())); } catch (e) { console.log("[POSITION VALUE ERROR] " + e); }
                          }
                        }
                      }
                    }
                  } catch(e) { console.log("[ROUTE POSITION ERROR] " + pname + " " + e); }
                }
                try {
                  var geometry = reflect0(route2, "getGeometry");
                  console.log("[GEOMETRY] " + (geometry === null ? "NULL" : geometry.getClass().getName()));
                  if (geometry !== null) {
                    var points = reflect0(geometry, "getPoints");
                    console.log("[GEOMETRY POINT COUNT] " + (points === null ? "NULL" : Java.cast(points, List).size()));
                  }
                } catch(e) { console.log("[GEOMETRY ERROR] " + e); }
              }
              if (count > 0) {
                var mp = reflect0(list.get(0), "getPosition");
                console.log("[MANOEUVRE POSITION] " + (mp === null ? "NULL" : mp.getClass().getName()));
                if (mp !== null) {
                  for (var mpm of mp.getClass().getMethods()) {
                    if (/get[A-Z]/.test(mpm.toString()) && /point|segment|fraction|position|distance/i.test(mpm.toString())) {
                      console.log("[MANOEUVRE POSITION METHOD] " + mpm.toString());
                      if (mpm.getParameterTypes().length === 0) {
                        try { console.log("[MANOEUVRE POSITION VALUE] " + mpm.getName() + "=" + reflect0(mp, mpm.getName())); } catch(e) { console.log("[MANOEUVRE VALUE ERROR] " + e); }
                      }
                    }
                  }
                }
              }
            } catch(e) { console.log("[POSITION INSPECTION ERROR] " + e); }
            console.log("[SUCCESS] Position inspection finished");
          } catch (e) { console.log("[ERROR] " + e); console.log("[STACK] " + e.stack); }
        });
      } catch (e) { console.log("[ERROR] " + e); }
    },
    onComplete: function () { console.log("[INSTANCES] " + (found ? "FOUND" : "NONE")); }
  });
  setTimeout(function () { console.log("[TEST COMPLETE]"); }, 10000);
});
