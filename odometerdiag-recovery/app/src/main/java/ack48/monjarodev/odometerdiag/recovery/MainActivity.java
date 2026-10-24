package ack48.monjarodev.odometerdiag.recovery;

import android.app.Activity;
import android.os.Bundle;
import android.os.StrictMode;
import android.widget.TextView;
import android.graphics.Typeface;
import android.content.Context;
import android.net.wifi.WifiManager;
import java.net.*;
import java.io.*;
import java.security.SecureRandom;
import java.util.concurrent.*;

public class MainActivity extends Activity {
    private static final int PORT = 8766;
    private String token;
    private volatile boolean running = true;
    private ServerSocket server;
    private final ExecutorService workers = Executors.newFixedThreadPool(3);
    private TextView status;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        byte[] random = new byte[16];
        new SecureRandom().nextBytes(random);
        StringBuilder t = new StringBuilder();
        for(byte v: random) t.append(String.format("%02x",v & 255));
        token=t.toString();
        status=new TextView(this);
        status.setTextSize(19);
        status.setTypeface(Typeface.MONOSPACE);
        status.setPadding(28,32,24,24);
        setContentView(status);
        updateStatus("Starting...");
        new Thread(() -> serve()).start();
    }
    private void updateStatus(String state) {
        runOnUiThread(() -> status.setText("MONJARO DIAG Recovery 2.1\n\n"+state+
            "\n\nOpen on phone (same Wi-Fi/hotspot):\nhttp://"+ip()+":"+PORT+"/?token="+token+
            "\n\nThis is a separate experimental terminal. Original v1.9 remains installed.\n\nUse only on a trusted private network."));
    }
    private String ip() {
        try {
            for(java.util.Enumeration<NetworkInterface> es=NetworkInterface.getNetworkInterfaces();es.hasMoreElements();) {
                NetworkInterface ni=es.nextElement();
                if(!ni.isUp()||ni.isLoopback()) continue;
                for(java.util.Enumeration<InetAddress> a=ni.getInetAddresses();a.hasMoreElements();) {
                    InetAddress v=a.nextElement();
                    if(v instanceof Inet4Address && v.isSiteLocalAddress()) return v.getHostAddress();
                }
            }
        }catch(Exception ignored){}
        return "HEAD_UNIT_IP";
    }
    private void serve() {
        try {
            server=new ServerSocket();
            server.setReuseAddress(true);
            server.bind(new InetSocketAddress(PORT));
            updateStatus("Server running on port "+PORT);
            while(running) {
                Socket s=server.accept();
                s.setSoTimeout(10000);
                workers.execute(() -> handle(s));
            }
        }catch(Exception e){if(running)updateStatus("Server error: "+e);}
    }
    private static String esc(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;");
    }
    private String page() {
        return "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><meta charset='utf-8'>"+
          "<style>body{background:#101820;color:#eaf1f5;font:16px sans-serif;margin:20px}textarea{width:100%;height:150px;box-sizing:border-box;background:#1b2934;color:white;padding:12px;font:15px monospace}button{padding:14px;margin:8px 4px;background:#26a6a0;border:0;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#18232d;padding:14px}</style></head><body>"+
          "<h2>Monjaro DIAG 2.1</h2><p>Private-network terminal. Commands run as root when SuperSU grants access.</p>"+
          "<textarea id='cmd' placeholder='id'></textarea><br><button onclick='paste()'>Paste</button><button onclick='run()'>Execute</button>"+
          "<button onclick='copy()'>Copy result</button><pre id='out'></pre>"+
          "<script>const tok=new URLSearchParams(location.search).get('token');"+
          "async function paste(){try{document.getElementById('cmd').value=await navigator.clipboard.readText()}catch(e){alert('Long-press command field and select Paste')}}"+
          "async function run(){let o=document.getElementById('out');o.textContent='Running...';try{let r=await fetch('/run?token='+encodeURIComponent(tok),{method:'POST',headers:{'Content-Type':'text/plain'},body:document.getElementById('cmd').value});o.textContent=await r.text()}catch(e){o.textContent=String(e)}}"+
          "async function copy(){let v=document.getElementById('out').textContent;try{await navigator.clipboard.writeText(v)}catch(e){let t=document.createElement('textarea');t.value=v;document.body.append(t);t.select();document.execCommand('copy');t.remove()}}</script></body></html>";
    }
    private void handle(Socket s) {
        try(Socket sock=s) {
            InputStream in=sock.getInputStream();
            OutputStream out=sock.getOutputStream();
            ByteArrayOutputStream head=new ByteArrayOutputStream();
            int b, prev=0, limit=0;
            while((b=in.read())!=-1 && limit++<16384) {
                head.write(b);
                byte[] h=head.toByteArray();
                int n=h.length;
                if(n>=4&&h[n-4]==13&&h[n-3]==10&&h[n-2]==13&&h[n-1]==10)break;
            }
            String header=head.toString("UTF-8");
            String[] lines=header.split("\\r?\\n");
            if(lines.length==0)return;
            String[] first=lines[0].split(" ");
            if(first.length<2)return;
            String uri=first[1];
            String auth="token="+token;
            if(!uri.contains(auth)) {reply(out,403,"Forbidden");return;}
            if(first[0].equals("GET")&&uri.startsWith("/?")){reply(out,200,page(),"text/html; charset=utf-8");return;}
            if(first[0].equals("POST")&&uri.startsWith("/run?")) {
                int len=0;
                for(String l:lines)if(l.toLowerCase().startsWith("content-length:"))len=Integer.parseInt(l.substring(l.indexOf(':')+1).trim());
                if(len<1||len>8192){reply(out,400,"Invalid command length");return;}
                byte[] buf=new byte[len];int off=0;
                while(off<len){int k=in.read(buf,off,len-off);if(k<0)break;off+=k;}
                String cmd=new String(buf,0,off,"UTF-8");
                reply(out,200,execute(cmd));
                return;
            }
            reply(out,404,"Not found");
        }catch(Exception ignored){}
    }
    private String execute(String cmd) {
        Process p=null;
        try {
            p=new ProcessBuilder("su","-c","sh").redirectErrorStream(true).start();
            try(OutputStream os=p.getOutputStream()) {
                os.write(cmd.getBytes("UTF-8"));os.write("\nexit\n".getBytes("UTF-8"));os.flush();
            }
            final Process proc=p;
            Future<String> f=workers.submit(() -> {
                ByteArrayOutputStream buf=new ByteArrayOutputStream();
                byte[] bytes=new byte[4096];int n;
                InputStream stream=proc.getInputStream();
                while((n=stream.read(bytes))!=-1) {
                    if(buf.size()+n>131072)break;
                    buf.write(bytes,0,n);
                }
                return buf.toString("UTF-8");
            });
            try {String result=f.get(12,TimeUnit.SECONDS);p.waitFor(1,TimeUnit.SECONDS);return result.isEmpty()?"(no output)":result;}
            catch(TimeoutException e){p.destroy();f.cancel(true);return "Command timed out (12 seconds)";}
        }catch(Exception e){return "Execution error: "+e;}
        finally{if(p!=null)p.destroy();}
    }
    private void reply(OutputStream out,int code,String body)throws IOException{reply(out,code,body,"text/plain; charset=utf-8");}
    private void reply(OutputStream out,int code,String body,String type)throws IOException{
        byte[] data=body.getBytes("UTF-8");
        String h="HTTP/1.1 "+code+" "+(code==200?"OK":"Error")+"\r\nContent-Type: "+type+"\r\nContent-Length: "+data.length+"\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n";
        out.write(h.getBytes("UTF-8"));out.write(data);out.flush();
    }
    @Override protected void onDestroy(){running=false;try{if(server!=null)server.close();}catch(Exception ignored){}workers.shutdownNow();super.onDestroy();}
}
