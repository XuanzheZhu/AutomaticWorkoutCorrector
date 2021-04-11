import { Component, OnInit } from '@angular/core';

export interface countElement {
  workoutType: String;
  goal: Number;
  count: Number;
}

@Component({
  selector: 'app-table-demo',
  templateUrl: './table-demo.component.html',
  styleUrls: ['./table-demo.component.css']
})
export class TableDemoComponent implements OnInit {

  displayedColumns: string[] = ["workoutType", "goal", "count"];
  workoutCounts: countElement[] = [
    {workoutType: "Side Lateral Raise", goal: 30, count: 0},
    {workoutType: "Squat", goal: 20, count: 20},
    {workoutType: "Burpees", goal: 30, count: 15},
  ];

  constructor() {}

  ngOnInit(): void {
  }

}
