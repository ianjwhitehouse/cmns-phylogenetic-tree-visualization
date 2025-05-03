//Handles the node frequency moving figures

//SET UP GLOBAL VARIABLES
// var percentages = [0.97, 0.7, 0.4, 0.33];
var percentages = []
// var x_pos = 100;
// var y_pos = [100, 200, 300, 400];
var radius = 4;
var total = 100;
//color pairs for each circle
var colors = []//[['red', 'steelblue'], ['steelblue', 'green'], ['green', 'purple'], ['purple', 'pink']];
var background = "rgb(255, 255, 255)";
var perm_locations = [];
var prev_level = 0;
var text_labels = [];
var text_locations = [];

function createBalls(arr, x_pos, y_pos, cluster_names){
    //set the new global variables
    console.log(arr);

    // arr.forEach(element => {
    //     sum = 0;
    //     element.forEach(function(i) {
    //         sum += i;
    //     });
    //     percentages.push(sum / element.length);
    // });
    arr.forEach(element => {
            if (element[0] == 0){
                percentages.push(1);
            }
            else{
                percentages.push(element[0]);
            }
        }); //now we're just doing the first set
    console.log(percentages);
    percentages.forEach(element => {
        colors.push(['#fc4f30', '#17becf']);
    });
    var curr_string = ''; 
    for (let i = 0; i < cluster_names.length; i++){ //!!! Need a case for when percentage is 0
        if (percentages[i] == 1){
            curr_string = curr_string;
            text_labels.push(['No new mutations', curr_string]);
        }
        else if (i === 0){
            text_labels.push(["No mutations", cluster_names[i].toString()]);
            curr_string = curr_string  + cluster_names[i].toString();
        }
        else {
            var temp = [curr_string];
            curr_string = curr_string + ", " + cluster_names[i].toString();
            temp.push(curr_string);
            text_labels.push(temp);
        }
    }
    console.log(text_labels);


    locations = [];
    num_balls = total;
    for (let i = 0; i < percentages.length; i++){
        //start with random locations
        var data = Array.from({ length: num_balls }, (_, index) => ({
            x: Math.random() * x_pos - (index * 15),
            y: Math.random() * y_pos[i] - (index * 15),
            r: radius
        }));
        //use force simulation to make a circle
        sim = d3.forceSimulation(data)
            .force("x", d3.forceX(x_pos)) 
            .force("y", d3.forceY(y_pos[i]))
            .force("collide", d3.forceCollide(radius+2).iterations(3))
            // ... chain together as many forces as we want
            .stop()
            .tick(35);
        
        // Sort by y-coordinate
        data.sort((a, b) => a.y - b.y);

        //add text locations
        var highest = data[0].y;
        var lowest = data[data.length - 1].y;
        text_locations.push([[x_pos, highest - 5], [x_pos, lowest + 15]])
        
        // Add id and color attributes
        data = data.map((ball, index) => ({
            ...ball,
            color: Boolean(index <= (num_balls * (1 - percentages[i])) && percentages[i] < 1)
        }));

        perm_locations.push(data);
        num_balls = num_balls * percentages[i];
    }
    //Make the starting top level circles
    console.log(perm_locations);
    var circles = d3.select("svg").selectAll("circle")
        .data(perm_locations[0])
        .enter()
        .append("circle")
        .attr('cx', function(d){
            return d.x;
        })
        .attr('cy', function(d){
            return d.y;
        })
        .attr("r", 5)
        .attr("fill", function(d){
            if (d.color){
                return colors[0][0];
            }
            else {
                return colors[0][1];
            }
        });
    
    //Make the starting labels
    var level = 0
    var labels = text_labels[level].map((label, i) => ({
        label: label,
        x: text_locations[level][i][0],
        y: text_locations[level][i][1],
        color: colors[level][i % 2]
    }));
    d3.select("svg")
        .selectAll("text.dynamic-label")
        .data(labels)
        .join("text")
        .attr("class", "dynamic-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.label)
        .attr("font-size", "14px")
        .attr("fill", d => d.color);
}


//Move function: 
function transitionCircles(level){
    if (level == prev_level){
        return;
    }
    //first, remove the labels
    d3.select("svg")
        .selectAll("text.dynamic-label")
        .remove();
    //Move the balls to new positions
    if (level > prev_level){
        //Moving down the tree
        newData = perm_locations[level];
        //remove the extra dots
        index = 100 - perm_locations[level].length
        d3.select("svg").selectAll("circle")
            .filter(function (d, i) {return i <= index -1;})
            .transition().duration(900)
            .ease(d3.easePoly.exponent(2))
            .attr('fill', background);
        //move the remaining dots
        d3.select("svg").selectAll("circle")
            .filter(function (d, i) {return i > index-1;})
            .data(newData)
            .transition().duration(900)
            .ease(d3.easePoly.exponent(2))
            .delay(function(d, i) {
                return 900 + i * 3;
              })
            .attr('cx', function(d){
                return d.x
            })
            .attr('cy', function(d){
                return d.y
            });
        //Recolor the balls
        d3.select("svg").selectAll("circle")
            .filter(function (d, i) {return i > index-1;})
            .data(newData)
            .transition().delay(2000).duration(900)
            .ease(d3.easePoly.exponent(2))
            .attr("fill", function(d){
                if (d.color){
                    return colors[level][0]
                }
                else {
                    return colors[level][1]
                }
            });
    }
    if (level < prev_level){
        //Moving up the tree
        //move the circles
        newData = perm_locations[level];
        index = 100 - perm_locations[level].length
        d3.select("svg").selectAll("circle")
            .filter(function (d, i) {return i > index-1;})
            .data(newData)
            .transition().duration(900)
            .delay(function(d, i) {
                return i * 3;
              })
            .attr('cx', function(d){
                return d.x
            })
            .attr('cy', function(d){
                return d.y
            });
        //recolor the circles
        d3.select("svg").selectAll("circle")
            .filter(function (d, i) {return i > index-1;})
            .data(newData)
            .transition().delay(1500).duration(900)
            .attr("fill", function(d){
                if (d.color){
                    return colors[level][0]
                }
                else {
                    return colors[level][1]
                }
            });
    }
    //add new text boxes in
    var labels = text_labels[level].map((label, i) => ({
        label: label,
        x: text_locations[level][i][0],
        y: text_locations[level][i][1],
        color: colors[level][i % 2]
    }));
    d3.select("svg")
        .selectAll("text.dynamic-label")
        .data(labels)
        .join("text")
        .attr("class", "dynamic-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.label)
        .attr("font-size", "14px")
        .attr("fill", d => d.color)
        .transition().delay(1500).duration(900); //transition isn't working


    prev_level = level;
}


//Listeners
var button0 = document.getElementById('moveButton0');
var button1 = document.getElementById('moveButton1');
var button2 = document.getElementById('moveButton2');
var button3 = document.getElementById('moveButton3');

button0.addEventListener('click', function() {
    transitionCircles(0)
});
button1.addEventListener('click', function() {
    transitionCircles(1)
});
button2.addEventListener('click', function() {
    transitionCircles(2)
});
button3.addEventListener('click', function() {
    transitionCircles(3)
});
