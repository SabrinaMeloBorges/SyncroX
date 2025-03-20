import { Component, OnInit } from '@angular/core';
import { FirebaseTSAuth } from 'firebasets/firebasetsAuth/firebaseTSAuth';
import { FirebaseTSFirestore } from 'firebasets/firebasetsFirestore/FirebaseTSFirestore';
import { FirebaseTSApp } from 'firebasets/firebasetsApp/FirebaseTSApp';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit {
  selectedImageFile: File | null = null; // Inicializado como null
  imageUrl: string | ArrayBuffer | null = null; // URL da imagem para preview
  auth = new FirebaseTSAuth();
  firestore = new FirebaseTSFirestore();

  constructor(private dialog: MatDialogRef<CreatePostComponent>) { }

  ngOnInit(): void { }

  // Função chamada quando o botão de envio é pressionado
  onPostClick(commentInput: HTMLTextAreaElement) {
    let comment = commentInput.value;
    if (comment.length <= 0) return;

    if (this.selectedImageFile) {
      this.generateLocalImageUrl().then(() => {
        this.uploadPostWithImage(comment).then(() => {
          this.dialog.close(); // Fecha o diálogo após o upload
        }).catch(error => {
          console.error("Erro ao criar post com imagem:", error);
        });
      }).catch(error => {
        console.error("Erro ao gerar URL da imagem:", error);
      });
    } else {
      this.uploadPost(comment).then(() => {
        this.dialog.close(); // Fecha o diálogo após o upload
      }).catch(error => {
        console.error("Erro ao criar post sem imagem:", error);
      });
    }
  }

  // Função para gerar a URL local da imagem
  generateLocalImageUrl(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedImageFile) {
        reject("Nenhum arquivo de imagem selecionado.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result; // Atualiza a URL da imagem
        resolve();
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(this.selectedImageFile);
    });
  }

  // Função para fazer o upload do post com a imagem
  uploadPostWithImage(comment: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imageUrl) {
        reject("imageUrl não foi gerada corretamente.");
        return;
      }

      let postId = this.firestore.genDocId();
      this.firestore.create(
        {
          path: ["Posts", postId],
          data: {
            comment: comment,
            creatorId: this.auth.getAuth().currentUser?.uid,
            imageUrl: this.imageUrl, // Usa a URL local da imagem
            timestamp: FirebaseTSApp.getFirestoreTimestamp()
          },
          onComplete: () => {
            resolve();
          },
          onFail: (error) => {
            reject(error);
          }
        }
      );
    });
  }

  // Função para fazer o upload do post sem a imagem
  uploadPost(comment: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.create(
        {
          path: ["Posts"],
          data: {
            comment: comment,
            creatorId: this.auth.getAuth().currentUser?.uid,
            imageUrl: "assets/home_background.png", // Imagem padrão
            timestamp: FirebaseTSApp.getFirestoreTimestamp()
          },
          onComplete: () => {
            resolve();
          },
          onFail: (error) => {
            reject(error);
          }
        }
      );
    });
  }

  // Função chamada quando uma imagem é selecionada
  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      this.clearImagePreview(); // Limpa o preview se nenhum arquivo for selecionado
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) { // Verifica se o arquivo é uma imagem
      console.warn("O arquivo selecionado não é uma imagem.");
      this.clearImagePreview(); // Limpa o preview se o arquivo não for uma imagem
      return;
    }

    this.selectedImageFile = file;

    // Gera o preview da imagem
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageUrl = e.target.result; // Atualiza a URL da imagem para o preview
    };
    reader.onerror = (error) => {
      console.error("Erro ao ler o arquivo:", error);
      this.clearImagePreview(); // Limpa o preview em caso de erro
    };
    reader.readAsDataURL(file);
  }

  // Função para limpar o preview da imagem
  clearImagePreview() {
    this.selectedImageFile = null;
    this.imageUrl = null;
  }
}