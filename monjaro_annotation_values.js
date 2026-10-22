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
            console.log("[SUCCESS] Annotation values inspected");
          } catch (e) { console.log("[ERROR] " + e); console.log("[STACK] " + e.stack); }
        });
      } catch (e) { console.log("[ERROR] " + e); }
    },
    onComplete: function () { console.log("[INSTANCES] " + (found ? "FOUND" : "NONE")); }
  });
  setTimeout(function () { console.log("[TEST COMPLETE]"); }, 10000);
});
