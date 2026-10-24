package ack48.monjarodev.odometerdiag.recovery;
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle b){super.onCreate(b);TextView v=new TextView(this);v.setPadding(24,32,24,24);v.setText("Monjaro DIAG Recovery\n\nProject scaffold is building. Original diagnostic server is not yet recovered.\n\nKeep v1.9 installed.");setContentView(v);}
}
