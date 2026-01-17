package com.libriseatpro.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // This will force the layout to respect system windows, avoiding overlap with system bars.
        View rootView = getWindow().getDecorView().getRootView();
        rootView.setFitsSystemWindows(true);
    }
}
