console.log("[MONJARO] Main-thread Windshield test");
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
            console.log("[SUCCESS] Windshield accessible");
          } catch (e) { console.log("[ERROR] " + e); console.log("[STACK] " + e.stack); }
        });
      } catch (e) { console.log("[ERROR] " + e); }
    },
    onComplete: function () { console.log("[INSTANCES] " + (found ? "FOUND" : "NONE")); }
  });
  setTimeout(function () { console.log("[TEST COMPLETE]"); }, 10000);
});
