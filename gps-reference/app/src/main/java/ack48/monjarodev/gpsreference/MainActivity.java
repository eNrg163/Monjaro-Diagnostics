package ack48.monjarodev.gpsreference;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQ=77;
    private LocationManager lm;
    private TextView status, latest;
    private Button start, stop;
    private volatile boolean running=false;
    private int count=0;
    private DatagramSocket socket;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        lm=(LocationManager)getSystemService(LOCATION_SERVICE);
        LinearLayout box=new LinearLayout(this); box.setOrientation(1); box.setPadding(28,36,28,24); box.setGravity(Gravity.CENTER_HORIZONTAL);
        TextView title=new TextView(this); title.setText("Monjaro GPS Reference 1.0"); title.setTextSize(22);
        status=new TextView(this); status.setText("Готово. Нажми «Старт GPS»."); status.setTextSize(16);
        latest=new TextView(this); latest.setText("Ожидание координат"); latest.setTextSize(18);
        start=new Button(this); start.setText("Старт GPS"); start.setOnClickListener(v->begin());
        stop=new Button(this); stop.setText("Стоп"); stop.setOnClickListener(v->end());
        TextView info=new TextView(this); info.setText("GPS записывается и отправляется в Termux на 127.0.0.1:49559. Держи приложение открытым во время теста.");
        box.addView(title); box.addView(status); box.addView(latest); box.addView(start); box.addView(stop); box.addView(info);
        setContentView(box);
    }
    private void begin() {
        if (Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},REQ); return;
        }
        try {
            socket=new DatagramSocket();
            running=true; count=0;
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER,500,0,listener);
            status.setText("GPS активен; ожидаю первое измерение…");
        } catch(Exception e) { status.setText("Ошибка запуска: "+e); end(); }
    }
    private final LocationListener listener=new LocationListener() {
        @Override public void onLocationChanged(Location l) {
            if(!running) return;
            count++;
            String line=System.currentTimeMillis()+","+l.getTime()+","+l.getLatitude()+","+l.getLongitude()+","+l.getAccuracy()+","+(l.hasSpeed()?l.getSpeed():-1)+","+(l.hasBearing()?l.getBearing():-1)+","+l.getProvider();
            latest.setText(String.format(java.util.Locale.US,"%.6f, %.6f\nТочность %.1f м | Скорость %.1f км/ч | курс %.1f°",
                l.getLatitude(),l.getLongitude(),l.getAccuracy(),l.hasSpeed()?l.getSpeed()*3.6:0,l.hasBearing()?l.getBearing():0));
            status.setText("GPS измерений: "+count+"\nUDP: 127.0.0.1:49559");
            new Thread(()->{try {
                byte[] data=("GPS1,"+line).getBytes(StandardCharsets.UTF_8);
                DatagramPacket p=new DatagramPacket(data,data.length,InetAddress.getByName("127.0.0.1"),49559);
                if(socket!=null&&!socket.isClosed()) socket.send(p);
            } catch(Exception ignored){} }).start();
        }
        @Override public void onProviderEnabled(String p) {}
        @Override public void onProviderDisabled(String p) { runOnUiThread(()->status.setText("GPS-провайдер выключен")); }
    };
    private void end() {
        running=false;
        try { lm.removeUpdates(listener); } catch(Exception ignored){}
        if(socket!=null){socket.close();socket=null;}
        if(status!=null) status.setText("Остановлено. GPS измерений: "+count);
    }
    @Override public void onRequestPermissionsResult(int r,String[] p,int[] g) {
        super.onRequestPermissionsResult(r,p,g);
        if(r==REQ && g.length>0 && g[0]==PackageManager.PERMISSION_GRANTED) begin();
        else status.setText("Нужно разрешение точного местоположения.");
    }
    @Override protected void onDestroy(){end();super.onDestroy();}
}
