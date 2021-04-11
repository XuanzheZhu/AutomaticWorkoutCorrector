import { Component, OnInit } from '@angular/core';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-grid-list-demo',
  templateUrl: './grid-list-demo.component.html',
  styleUrls: ['./grid-list-demo.component.css']
})
export class GridListDemoComponent implements OnInit {

  tiles: Tile[] = [
    {text: 'A tile', cols: 4, rows: 2, color: 'lightgreen'},
    {text: 'Another tile', cols: 2, rows: 4, color: 'lightblue'},
    {text: 'One more tile', cols: 2, rows: 4, color: 'lightyellow'},
    {text: 'I am white', cols: 2, rows: 2, color: 'white'},
    {text: 'I love grey', cols: 4, rows: 2, color: 'lightgrey'},
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
