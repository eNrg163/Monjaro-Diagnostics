console.log("[MONJARO] Main-thread Guidance test");
Java.perform(function () {
    var Thread = Java.use("java.lang.Thread");
    var Looper = Java.use("android.os.Looper");
    var Binding = Java.use("com.yandex.mapkit.navigation.automotive.internal.NavigationBinding");
    function field(obj, name) {
        var cls = obj.getClass();
        while (cls !== null) {
            try {
                var f = cls.getDeclaredField(name);
                f.setAccessible(true);
                return f.get(obj);
            } catch (e) { cls = cls.getSuperclass(); }
        }
        throw new Error("Field not found: " + name);
    }
    var found = false;
    Java.choose("oa1", {
        onMatch: function (listener) {
            if (found) return;
            found = true;
            try {
                var q9 = field(listener, "a");
                var n9 = field(q9, "e");
                var raw = field(n9, "a");
                var binding = Java.retain(Java.cast(raw, Binding));
                console.log("[BINDING] FOUND");
                Java.scheduleOnMainThread(function () {
                    try {
                        console.log("[THREAD] " + Thread.currentThread().getName() +
                          " main=" + Looper.getMainLooper().isCurrentThread());
                        console.log("[CALL] getGuidance");
                        var guidance = binding.getGuidance();
                        if (guidance === null) {
                            console.log("[GUIDANCE] NULL");
                        } else {
                            console.log("[GUIDANCE] " + guidance.$className);
                            console.log("[SUCCESS]");
                        }
                    } catch (e) {
                        console.log("[ERROR] " + e);
                        console.log("[STACK] " + e.stack);
                    }
                });
            } catch (e) { console.log("[ERROR] " + e); }
        },
        onComplete: function () { console.log("[SEARCH COMPLETE]"); }
    });
    setTimeout(function () { console.log("[TEST COMPLETE]"); }, 10000);
});
