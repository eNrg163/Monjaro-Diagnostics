package ack48.monjarodev.gpsreference;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.location.*;
import android.os.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

public class GpsService extends Service {
    public static final String START="ack48.monjarodev.gpsreference.START";
    public static final String STOP="ack48.monjarodev.gpsreference.STOP";
    private static final String CHANNEL="gps_reference_location";
    private LocationManager manager;
    private DatagramSocket socket;
    private ExecutorService sender;
    private LocationListener listener;
    private int count=0;
    private volatile boolean active=false;

    @Override public void onCreate() {
        super.onCreate();
        if(Build.VERSION.SDK_INT>=26) {
            NotificationChannel channel=new NotificationChannel(CHANNEL,"Monjaro GPS tracking",NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(channel);
        }
    }

    private Notification notification(String detail) {
        Intent intent=new Intent(this,MainActivity.class);
        PendingIntent pi=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b=Build.VERSION.SDK_INT>=26 ? new Notification.Builder(this,CHANNEL) : new Notification.Builder(this);
        return b.setContentTitle("Monjaro GPS Reference").setContentText(detail)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentIntent(pi)
            .setOngoing(true).build();
    }

    @Override public int onStartCommand(Intent intent,int flags,int startId) {
        if(intent!=null && STOP.equals(intent.getAction())) { stopSelf(); return START_NOT_STICKY; }
        if(active) return START_STICKY;
        try {
            if(Build.VERSION.SDK_INT>=29) startForeground(18,notification("GPS работает в фоне"),android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            else startForeground(18,notification("GPS работает в фоне"));
            if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED)
                throw new SecurityException("Нет разрешения точной геолокации");
            manager=(LocationManager)getSystemService(LOCATION_SERVICE);
            socket=new DatagramSocket();
            sender=Executors.newSingleThreadExecutor();
            listener=new LocationListener() {
                @Override public void onLocationChanged(Location l) { send(l); }
                @Override public void onProviderEnabled(String provider) {}
                @Override public void onProviderDisabled(String provider) { saveStatus("GPS отключён"); }
            };
            active=true;
            saveStatus("Ожидание GPS");
            manager.requestLocationUpdates(LocationManager.GPS_PROVIDER,500,0,listener,Looper.getMainLooper());
            return START_STICKY;
        } catch(Exception e) {
            saveStatus("Ошибка: "+e.getMessage());
            stopSelf();
            return START_NOT_STICKY;
        }
    }

    private void saveStatus(String state) {
        getSharedPreferences("gps",MODE_PRIVATE).edit().putString("status",state)
            .putInt("count",count).apply();
    }

    private void send(Location l) {
        if(!active || sender==null) return;
        final String payload="GPS1,"+System.currentTimeMillis()+","+l.getTime()+","+
            l.getLatitude()+","+l.getLongitude()+","+l.getAccuracy()+","+
            (l.hasSpeed()?l.getSpeed():-1)+","+(l.hasBearing()?l.getBearing():-1)+","+l.getProvider();
        sender.execute(()->{
            try {
                byte[] bytes=payload.getBytes(StandardCharsets.UTF_8);
                socket.send(new DatagramPacket(bytes,bytes.length,InetAddress.getByName("127.0.0.1"),49559));
                count++;
                getSharedPreferences("gps",MODE_PRIVATE).edit().putInt("count",count)
                    .putLong("last",System.currentTimeMillis()).putString("status","Передача GPS активна").apply();
            } catch(Exception e) { saveStatus("Ошибка UDP: "+e.getMessage()); }
        });
    }

    @Override public void onDestroy() {
        active=false;
        if(manager!=null && listener!=null) { try { manager.removeUpdates(listener); } catch(Exception ignored) {} }
        if(sender!=null) sender.shutdownNow();
        if(socket!=null) socket.close();
        getSharedPreferences("gps",MODE_PRIVATE).edit().putString("status","Остановлено").apply();
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
