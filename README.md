fileExplorerScroll
==================

This piece of work is based on another jQuery plugin work ddslick at:
http://designwithpc.com/Plugins/ddSlick

Some changes and new features are added to the code:
(1) Add checkbox for optional. Some extra time spent on aligning the checkbox and the rest of the contents for each item.
(2) Add UP/Down, PGUP/PGDN key functionality.
(3) Changed selection on scroll. The Windows file explorer behavior is used here:
    When PGUP/PGDN, if the selected item is not at the edge in scroll direction, the edge item would be selected; otherwise, the scroll position would go for a certain number of items instead of a fixed distance.
    
The demo: http://jsfiddle.net/kingvagabond/b4qJ6/

TODO list:
Add multi-selection with mouse and Ctrl, Shift key.
  
