package com.beangrowth.app;

import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "BeanGrowthGoogleAuth")
public class GoogleCredentialPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        int resourceId = getContext().getResources().getIdentifier(
                "default_web_client_id",
                "string",
                getContext().getPackageName()
        );

        if (resourceId == 0) {
            call.reject("default_web_client_id が見つかりません。Firebaseから最新の google-services.json を取得し、android/app/google-services.json に配置してください。");
            return;
        }

        String serverClientId = getContext().getString(resourceId);
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            call.reject("Google Web Client ID が空です。google-services.json を確認してください。");
            return;
        }

        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(serverClientId)
                .setAutoSelectEnabled(false)
                .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();

        CredentialManager credentialManager = CredentialManager.create(getActivity());

        credentialManager.getCredentialAsync(
                getActivity(),
                request,
                new CancellationSignal(),
                getActivity().getMainExecutor(),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(@NonNull GetCredentialResponse result) {
                        Credential credential = result.getCredential();

                        if (credential instanceof CustomCredential
                                && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                            try {
                                CustomCredential customCredential = (CustomCredential) credential;
                                GoogleIdTokenCredential googleCredential =
                                        GoogleIdTokenCredential.createFrom(customCredential.getData());

                                JSObject ret = new JSObject();
                                ret.put("idToken", googleCredential.getIdToken());
                                ret.put("email", googleCredential.getId());
                                call.resolve(ret);
                            } catch (Exception e) {
                                call.reject("Google認証情報の解析に失敗しました。", e);
                            }
                        } else {
                            call.reject("Google ID Token形式の認証情報を取得できませんでした。");
                        }
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        call.reject("Googleアカウント選択に失敗しました: " + e.getMessage(), e);
                    }
                }
        );
    }
}
