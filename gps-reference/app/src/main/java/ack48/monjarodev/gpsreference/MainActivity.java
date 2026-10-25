package ack48.monjarodev.gpsreference;

import android.Manifest;
import android.app.Activity;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.view.Gravity;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import android.widget.*;

public class MainActivity extends Activity {
    private static final int LOCATION_REQUEST=77;
    private static final int NOTIFICATION_REQUEST=78;
    private TextView status;
    private Handler handler=new Handler(Looper.getMainLooper());
    private final Runnable refresh=new Runnable() {
        @Override public void run() {
            android.content.SharedPreferences p=getSharedPreferences("gps",MODE_PRIVATE);
            long last=p.getLong("last",0);
            String state=p.getString("status","Остановлено");
            boolean stopped="Остановлено".equals(state) || "Готово. Нажми «Старт GPS».".equals(state);
            boolean transmitting="Передача GPS активна".equals(state);
            boolean waiting="Ожидание GPS".equals(state);
            String indicator=transmitting?"🟢":waiting?"🟡":"🔴";
            String lastText;
            if(last==0) lastText="нет";
            else if(stopped || (!transmitting && !waiting))
                lastText=new SimpleDateFormat("HH:mm:ss",Locale.getDefault()).format(new Date(last));
            else {
                long age=Math.max(0,(System.currentTimeMillis()-last)/1000);
                lastText=age+" сек назад";
                if(transmitting && age>5) indicator="🟡";
            }
            status.setText(indicator+" "+state+
                "\\nОтправлено: "+p.getInt("count",0)+
                "\\nПоследняя отправка: "+lastText+
                "\\nUDP: 127.0.0.1:49559");
            handler.postDelayed(this,1000);
        }
    };
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        LinearLayout box=new LinearLayout(this);
        box.setOrientation(1);box.setPadding(28,36,28,24);box.setGravity(Gravity.CENTER_HORIZONTAL);
        TextView title=new TextView(this);title.setText("Monjaro GPS Reference 2.1");title.setTextSize(22);
        status=new TextView(this);status.setTextSize(17);
        Button start=new Button(this);start.setText("Старт GPS");start.setOnClickListener(v->begin());
        Button stop=new Button(this);stop.setText("Стоп GPS");stop.setOnClickListener(v->{
            Intent i=new Intent(this,GpsService.class);i.setAction(GpsService.STOP);startService(i);
        });
        TextView info=new TextView(this);
        info.setText("GPS продолжает передаваться в фоне через службу с уведомлением. Запускай GPS из открытого приложения.");
        box.addView(title);box.addView(status);box.addView(start);box.addView(stop);box.addView(info);
        setContentView(box);
    }
    private void begin() {
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},LOCATION_REQUEST);
            return;
        }
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFICATION_REQUEST);
            return;
        }
        Intent i=new Intent(this,GpsService.class);i.setAction(GpsService.START);
        if(Build.VERSION.SDK_INT>=26) startForegroundService(i);else startService(i);
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(request,permissions,results);
        if(request==LOCATION_REQUEST && results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) begin();
        else if(request==NOTIFICATION_REQUEST) beginAfterNotification();
        else Toast.makeText(this,"Нужно разрешить точное местоположение",Toast.LENGTH_LONG).show();
    }
    private void beginAfterNotification() {
        Intent i=new Intent(this,GpsService.class);i.setAction(GpsService.START);
        if(Build.VERSION.SDK_INT>=26) startForegroundService(i);else startService(i);
    }
    @Override protected void onResume(){super.onResume();handler.post(refresh);}
    @Override protected void onPause(){handler.removeCallbacks(refresh);super.onPause();}
}
