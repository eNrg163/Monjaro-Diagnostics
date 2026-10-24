package ack48.monjarodev.odometerdiag.recovery;

import android.app.Service;
import android.content.Intent;
import android.hardware.*;
import android.os.*;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;

public class SensorStreamService extends Service implements SensorEventListener {
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    private final Object lock=new Object();
    private SensorManager sensors;
    private DatagramSocket socket;
    private InetAddress target;
    private volatile boolean active;
    private Thread discoveryThread;
    private volatile float gx,gy,gz,ax,ay,az;
    private volatile long gyroNs,accelNs;
    private volatile String speed="",steer="",gear="";
    private volatile long carMs;
    private volatile long seq;
    @Override public void onCreate(){
        super.onCreate();
        sensors=(SensorManager)getSystemService(SENSOR_SERVICE);
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent==null)return START_NOT_STICKY;
        if("STOP".equals(intent.getAction())){stopSelf();return START_NOT_STICKY;}
        String ip=intent.getStringExtra("phone_ip");
        if(ip==null||(!"AUTO".equals(ip)&&!ip.matches("(\\d{1,3}\\.){3}\\d{1,3}"))){stopSelf();return START_NOT_STICKY;}
        try{if(!"AUTO".equals(ip))target=InetAddress.getByName(ip);socket=new DatagramSocket();}catch(Exception e){stopSelf();return START_NOT_STICKY;}
        if(active)return START_STICKY;
        active=true;
        if("AUTO".equals(ip))startDiscovery();
        Sensor gyro=sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        Sensor accel=sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if(gyro!=null)sensors.registerListener(this,gyro,20000);
        if(accel!=null)sensors.registerListener(this,accel,20000);
        worker.scheduleWithFixedDelay(()->{
            speed=read("VehSpdIndcdVehSpdIndcd");
            steer=read("SteerWhlSnsrAg");
            gear=read("gearlvrindcn");
            carMs=System.currentTimeMillis();
        },0,500,TimeUnit.MILLISECONDS);
        worker.scheduleAtFixedRate(()->send(),0,20,TimeUnit.MILLISECONDS);
        return START_STICKY;
    }
    private void startDiscovery(){
        discoveryThread=new Thread(()->{
            try(DatagramSocket receiver=new DatagramSocket(null)){
                receiver.setReuseAddress(true);
                receiver.bind(new InetSocketAddress(49558));
                receiver.setSoTimeout(2000);
                byte[] buf=new byte[128];
                while(active){
                    try{
                        DatagramPacket packet=new DatagramPacket(buf,buf.length);
                        receiver.receive(packet);
                        String beacon=new String(packet.getData(),packet.getOffset(),packet.getLength(),"UTF-8");
                        if("MONJARO_SENSOR_PHONE_V1".equals(beacon)&&packet.getAddress().isSiteLocalAddress())target=packet.getAddress();
                    }catch(SocketTimeoutException ignored){}
                }
            }catch(Exception ignored){}
        },"monjaro-phone-discovery");
        discoveryThread.setDaemon(true);
        discoveryThread.start();
    }
    private String read(String property){
        java.lang.Process p=null;
        try{
            p=new ProcessBuilder("su","-c","/vendor/bin/vehicle-hal-tool -p "+property+" --get").redirectErrorStream(true).start();
            BufferedReader br=new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while((line=br.readLine())!=null)if(line.contains("signal value")) {
                String[] parts=line.split(":");
                return parts.length>1?parts[1].trim():"";
            }
        }catch(Exception ignored){}finally{if(p!=null)p.destroy();}
        return "";
    }
    @Override public void onSensorChanged(SensorEvent e){
        synchronized(lock){
            if(e.sensor.getType()==Sensor.TYPE_GYROSCOPE){gx=e.values[0];gy=e.values[1];gz=e.values[2];gyroNs=e.timestamp;}
            if(e.sensor.getType()==Sensor.TYPE_ACCELEROMETER){ax=e.values[0];ay=e.values[1];az=e.values[2];accelNs=e.timestamp;}
        }
    }
    @Override public void onAccuracyChanged(Sensor s,int accuracy){}
    private void send(){
        if(!active||socket==null||target==null)return;
        String msg;
        synchronized(lock){
            msg="IMU2,"+(seq++)+","+System.currentTimeMillis()+","+SystemClock.elapsedRealtimeNanos()+","+
                carMs+","+speed+","+steer+","+gear+","+gyroNs+","+gx+","+gy+","+gz+","+
                accelNs+","+ax+","+ay+","+az;
        }
        try{
            byte[] data=msg.getBytes("UTF-8");
            socket.send(new DatagramPacket(data,data.length,target,49557));
        }catch(Exception ignored){}
    }
    @Override public void onDestroy(){
        active=false;
        if(sensors!=null)sensors.unregisterListener(this);
        worker.shutdownNow();
        if(socket!=null)socket.close();
        if(discoveryThread!=null)discoveryThread.interrupt();
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent i){return null;}
}
