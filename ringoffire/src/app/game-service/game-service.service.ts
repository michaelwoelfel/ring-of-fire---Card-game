import { Component, OnInit } from '@angular/core';
import { Game } from 'src/models/game';
import { GameComponent } from '../game/game.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddPlayerComponent } from '../dialog-add-player/dialog-add-player.component';
import { ViewChild } from '@angular/core';
import { GameDescriptionComponent } from 'src/app/game-description/game-description.component';
import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, collectionData, doc, onSnapshot, addDoc, deleteDoc, orderBy, collection, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DocumentData, updateDoc } from "firebase/firestore";
import { query, where, limit, } from "firebase/firestore";
import {ActivatedRoute} from '@angular/router';
import { DocumentChange } from '@angular/fire/firestore';
import { EditPlayerComponent } from '../player/edit-player/edit-player.component';
import { MatDialogRef } from '@angular/material/dialog';


@Injectable({
  providedIn: 'root'
})

export class  GameServiceService {
  firestore: Firestore = inject(Firestore);
  pickCardAnimation = false;
  readyToStart = false;
  currentCard: string = '';
  screenWidth = window.innerWidth;
  game: Game;
  gameOver = false;
  unsubGames;
  gameId: any;
  playerIndex: number = 0;
  gameSubscription: any;
  picSrc = "assets/img/person-female.png";
  games: Partial<Game>[] = [];


  constructor(public dialog: MatDialog, private route: ActivatedRoute,) {
    this.game = new Game();
    // this.subGamesListWidthItemMethod();
    this.unsubGames = this.subGamesList();
    // this.items$ = collectionData(this.getGameRef());
    // this.items = this.items$.subscribe((list) => {
    //   list.forEach(element => {
    //   this.games.push(element);
    //   });
    // });
  }

 
  ngOnInit(): void {
  }
  @ViewChild(GameDescriptionComponent, { static: false }) gameDescription!: GameDescriptionComponent;

    /**
   * Creates a new game instance.
   */
  newGame() {
    this.game = new Game();
  }

  /**
   * Updates the current game state in the Firestore database.
   * Handles errors by logging to the console.
   */
  async updateGame() {
     let docRef = this.getSingleGameRef("games",this.gameId);
         updateDoc(docRef, this.game.toJson()).catch(
          (error) => { console.log(error); }
        );
  }

  /**
   * Adds a new game to the Firestore database and sets the current game ID.
   * Logs the document ID to the console.
   * 
   */
  async addGame(gameObj: any) {
        const docRef = await addDoc(this.getGameRef(), gameObj);
        console.log("Document written with ID: ", docRef.id);
        this.gameId = docRef.id;
        return docRef.id; 
}

  /**
   * Opens a dialog to edit a player and updates the player's picture on dialog close.
   * 
   */
editPlayer(i:number): void {
  const dialogRef = this.dialog.open(EditPlayerComponent);
  console.log("Nummer des Spielers:", i);
  dialogRef.afterClosed().subscribe((picture: string) => {
  this.game.players[i].picture = this.picSrc;
  });
}

  /**
   * Subscribes to game list updates from Firestore.
   * Updates the local game state with changes from Firestore.
   * 
   */
  subGamesList() {
    return onSnapshot(this.getGameRef(), (list) => {
      this.games = [];
      list.forEach(element => {
        this.games.push(this.game.toJson(),element.data());
        console.log(element.data());
        let newGame = element.data();
        this.game.currentPlayer = newGame["currentPlayer"];
        this.game.playedCard = newGame["playedCard"];
        this.game.players = newGame["players"];
        console.log(this.game.players);
        this.game.stack = newGame["stack"];
        this.game.pickCardAnimation = newGame["pickCardAnimation"];
        this.game.readyToStart = newGame["readyToStart"];
        this.game.currentCard = newGame["currentCard"];
        this.game.gameOver = newGame["gameOver"];
      });
    });
  }

  /**
   * Cleans up subscriptions on component destruction.
   */
  ngOnDestroy() {
    this.unsubGames();
    // this.items.unsubscribe();
    this.gameSubscription.unsubscribe();
  }


   /**
   * Handles the logic for picking a card from the game stack.
   * Manages animations and checks the next player's turn.
   */
  pickCard() {
    if (this.game.players.length >= 2) {
      this.gameDescription.readyToStart = true;
      const card = this.game.stack.pop();
      if (card !== undefined && !this.pickCardAnimation) {
        this.currentCard = card;
        this.playAudio();
        this.pickCardAnimation = true;
      }
      this.pushCurrentCard();
    } else {
      this.gameDescription.readyToStart = false;
    }
  }

  
   /**
   * Pushes the current card to the played card array with a delay.
   * Also manages the next player logic.
   */
  pushCurrentCard() {
    setTimeout(() => {
      this.game.playedCard.push(this.currentCard);
      this.pickCardAnimation = false;
      this.checkNextPlayer();
    }, 2000)
  }


    /**
   * Plays a card sound effect from assets.
   */
  playAudio() {
    let audio = new Audio();
    audio.src = "assets/card-sound.mp3";
    audio.load();
    audio.play();
  }

 /**
   * Checks and updates the index of the next player.
   */
  checkNextPlayer() {
    if (this.game.currentPlayer == this.game.players.length - 1) {
      this.game.currentPlayer = 0;
    } else if (this.pickCardAnimation == false) {
      this.game.currentPlayer++;
    }
  }


  /**
   * Gets an array representing the remaining cards in the stack.
   */
  get cardArray(): number[] {
    const maxCards = 5;
    let start = Math.max(maxCards - this.game.stack.length, 0);
    if (this.game.stack.length == 0) {
      setTimeout(() => {
        this.gameOver = true;
      }, 3000)
    }
    return [1, 2, 3, 4, 5].slice(start);
  }


/**
   * Gets a Firestore collection reference for games.
   */
  getGameRef() {
    return collection(this.firestore, 'games');
  }

   /**
   * Gets a Firestore document reference for a single game.
   * 
   */
  getSingleGameRef(colId:string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
   }
}
