import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthenticatorComponent } from './tools/authenticator/authenticator.component';
import { FirebaseTSAuth } from 'firebasets/firebasetsAuth/firebaseTSAuth';
import { Router } from '@angular/router';
import { FirebaseTSFirestore } from 'firebasets/firebasetsFirestore/firebaseTSFirestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'CodeibleSocialMediaProject';
  auth = new FirebaseTSAuth();
  firestore = new FirebaseTSFirestore();
  userHasProfile = true;
  private static userDocument: UserDocument;

  constructor(private loginSheet: MatBottomSheet, private router: Router) {
    this.auth.listenToSignInStateChanges(user => {
      this.auth.checkSignInState({
        whenSignedIn: user => {},
        whenSignedOut: user => {
          AppComponent.userDocument = null;
        },
        whenSignedInAndEmailNotVerified: user => {
          this.router.navigate(["emailVerification"]);
        },
        whenSignedInAndEmailVerified: user => {
          this.getUserProfile();
        },
        whenChanged: user => {}
      });
    });
  }

  public static getUserDocument() {
    return AppComponent.userDocument;
  }

  getUsername() {
    try {
      return AppComponent.userDocument.publicName;
    } catch (err) {
      return "";
    }
  }

  getUserProfile() {
    return new Promise<number>((resolve, reject) => {
      this.firestore.listenToDocument({
        name: "Getting Document",
        path: ["Users", this.auth.getAuth().currentUser?.uid],
        onUpdate: (result) => {
          AppComponent.userDocument = <UserDocument>result.data();
          this.userHasProfile = result.exists;
          if (this.auth.getAuth().currentUser) {
            AppComponent.userDocument.userId = this.auth.getAuth().currentUser.uid;
          }
          if (this.userHasProfile) {
            this.router.navigate(["postfeed"]);
            resolve(1);
          } else {
            resolve(0);
          }
        }
      });
    });
  }

  onLogoutClick() {
    this.auth.signOut();
    localStorage.clear(); // Limpa o armazenamento local
    this.router.navigate(['/']); // Redireciona para a página inicial após o logout
  }

  loggedIn() {
    return this.auth.isSignedIn();
  }

  onLoginClick() {
    this.loginSheet.open(AuthenticatorComponent);
  }
}

export interface UserDocument {
  publicName: string;
  description: string;
  userId: string;
}
