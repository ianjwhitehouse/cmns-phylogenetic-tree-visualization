//Handles the node frequency moving figures

//SET UP GLOBAL VARIABLES
// var percentages = [0.97, 0.7, 0.4, 0.33];
var percentages_left = [];
var percentages_right = [];
// var x_pos = 100;
// var y_pos = [100, 200, 300, 400];
var radius = 4;
var total = 100;
//color pairs for each circle
var colors = [["#195c7d", "#30a2da"],['#c7670e', "#fc7f0b"],['#ad321c','#fc4f30'],['#0f707a','#17becf']]
var background = "rgb(255, 255, 255)";
var perm_locations_left = [];
var perm_locations_right = [];
var prev_level = 0;
var text_labels_left = [];
var text_locations = [];
var text_labels_right = [];

function createBalls(arr, x_pos, y_pos, cluster_names, max_levels){
    // arr.forEach(element => {
    //     sum = 0;
    //     element.forEach(function(i) {
    //         sum += i;
    //     });
    //     percentages.push(sum / element.length);
    // });
    
    //get percentages
    console.log(arr)
    var p_left = [];
    var p_right = [];
    for (let i = 0; i < arr[0].length; i++) {
        arr.forEach(element => {
            var p = element[i]
            if (p == 0){
                p = 1;
            }
            if (p_left.length == max_levels-1){
                if (p_right.length == 0){
                    p_right = p_left.slice(0,max_levels-1-2); //this is kinda cheating cause I know there's a difference of 2
                }
                p_right.push(p);
            }
            else{
                p_left.push(p);
            }
        });
        percentages_left.push(p_left);
        percentages_right.push(p_right);
        p_left = [];
        p_right = []
    }

    // percentages_left[0].forEach(element => {
    //     colors.push(['#fc4f30', '#17becf']);
    // });
    
    //make text labels
    var text_labels_l = [];
    var text_labels_r = [];
    for (let x = 0; x < percentages_left.length; x++){
        var curr_string = ''; 
        for (let i = 0; i < cluster_names.length; i++){
            if (percentages_left[x][i] == 1){
                curr_string = curr_string;
                text_labels_l.push(['No new mutations', curr_string]);
            }
            else if (i === 0){
                text_labels_l.push(["No mutations", cluster_names[i].toString()]);
                curr_string = curr_string  + cluster_names[i].toString();
            }
            else {
                var temp = [curr_string];
                curr_string = curr_string + ", " + cluster_names[i].toString();
                if (text_labels_l.length == max_levels-1){
                    if (text_labels_r.length == 0){
                        text_labels_r = text_labels_l.slice(0,max_levels-1-2);
                        curr_string = curr_string.slice(0,-9);
                        temp = [curr_string];
                        curr_string = curr_string + ", " + cluster_names[i].toString();
                    }
                    temp.push(curr_string);
                    text_labels_r.push(temp);
                }
                else{
                    temp.push(curr_string);
                    text_labels_l.push(temp);
                }
            }
        }
        text_labels_left.push(text_labels_l);
        text_labels_right.push(text_labels_r);
        text_labels_l = [];
        text_labels_r = [];
    }
    //Make balls (create location array for each level) for left side of tree
    locations = [];
    num_balls = total;
    var text_l = []
    for (let x = 0; x < percentages_left.length; x++){
        //should run 4 times (one for each sample)
        for (let i = 0; i < percentages_left[x].length; i++){
            //start with random locations
            var data = Array.from({ length: num_balls }, (_, index) => ({
                x: Math.random() * x_pos[x] - (index * 15),
                y: Math.random() * y_pos[i] - (index * 15),
                r: radius
            }));
            //use force simulation to make a circle
            sim = d3.forceSimulation(data)
                .force("x", d3.forceX(x_pos[x])) 
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
            text_l.push([[x_pos[x], highest - 15], [x_pos[x], lowest + 20]])
            
            // Add id and color attributes
            data = data.map((ball, index) => ({
                ...ball,
                color: Boolean(index <= (num_balls * (1 - percentages_left[x][i])) && percentages_left[x][i] < 1)
            }));

            //perm_locations.push(data);
            locations.push(data);
            num_balls = Math.floor(num_balls * percentages_left[x][i]);
        }
        perm_locations_left.push(locations);
        locations = [];
        num_balls = total;
        text_locations.push(text_l);
        text_l = [];
    }

    //Make balls (create location array for each level) for right side of tree
    locations = [];
    num_balls = total;
    for (let x = 0; x < percentages_right.length; x++){
        //should run 4 times (one for each sample)
        for (let i = 0; i < percentages_right[x].length; i++){
            //start with random locations
            var data = Array.from({ length: num_balls }, (_, index) => ({
                x: Math.random() * x_pos[x] - (index * 15),
                y: Math.random() * y_pos[i] - (index * 15),
                r: radius
            }));
            //use force simulation to make a circle
            sim = d3.forceSimulation(data)
                .force("x", d3.forceX(x_pos[x])) 
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
            //text_locations.push([[x_pos[x], highest - 5], [x_pos[x], lowest + 15]])
            
            // Add id and color attributes
            data = data.map((ball, index) => ({
                ...ball,
                color: Boolean(index <= (num_balls * (1 - percentages_right[x][i])) && percentages_right[x][i] < 1)
            }));

            //perm_locations.push(data);
            locations.push(data);
            num_balls = Math.floor(num_balls * percentages_right[x][i]);
        }
        perm_locations_right.push(locations);
        locations = [];
        num_balls = total;
    }
    //Initialize the starting top level circles
    for (let x = 0; x < percentages_left.length; x++){
        class_name = "circle" + x.toString()
        var circles = d3.select("svg").selectAll("circle")
            .filter("." + class_name)
            .data(perm_locations_left[x][0])
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
                    return colors[x][0];
                }
                else {
                    return colors[x][1];
                }
            })
            .classed(class_name, true);
    }
    
    //Make all labels
    //for each level
    for (let level = 0; level < percentages_left[0].length; level++){
        //x = sample number
        for (let x = 0; x < percentages_left.length; x++){
            class_name = "label" + x.toString() + level.toString() + "left";
            var labels = text_labels_left[x][level].map((label, i) => ({
                label: label,
                x: text_locations[x][level][i][0],
                y: text_locations[x][level][i][1],
                color: colors[x][i % 2]
            }));
            d3.select("svg")
                .selectAll("text.dynamic-label")
                .filter("." + class_name)
                .data(labels)
                .join("text")
                .attr("class", "dynamic-label")
                .attr("opacity", 0)
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .text(d => d.label)
                .attr("font-size", "14px")
                .attr("fill", d => d.color)
                .classed(class_name, true);
        }
    }
    for (let level = 0; level < percentages_left[0].length; level++){
        //x = sample number
        for (let x = 0; x < percentages_left.length; x++){
            class_name = "label" + x.toString() + level.toString() + "right";
            var labels = text_labels_right[x][level].map((label, i) => ({
                label: label,
                x: text_locations[x][level][i][0],
                y: text_locations[x][level][i][1],
                color: colors[x][i % 2]
            }));
            d3.select("svg")
                .selectAll("text.dynamic-label")
                .filter("." + class_name)
                .data(labels)
                .join("text")
                .attr("class", "dynamic-label")
                .attr("opacity", 0)
                .attr('font-weight','bold')
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .text(d => d.label)
                .attr("font-size", "14px")
                .attr("fill", d => d.color)
                .attr("text-anchor", "middle")
                .classed(class_name, true);
        }
    }
    //activate the top level labels
    for (let x = 0; x < percentages_left.length; x++){
        class_name = "label" + x.toString() + '0left' ;
        d3.select("svg")
            .selectAll("text.dynamic-label")
            .filter("." + class_name)
            .attr("opacity", 1)
            .attr("text-anchor", "middle")
            .attr('font-weight','bold');
    }
}


//Move function: 
function transitionCircles(level, id){
    if (level == id){
        var text_labels = text_labels_left;
        var locations = perm_locations_left;
        var dir = 'left'
    }
    else {
        var text_labels = text_labels_right;
        var locations = perm_locations_right;
        var dir = 'right'
    }
    if (level == prev_level){
        return;
    }
    //first, remove the labels
    for (let x = 0; x < percentages_left.length; x++){
        class_name = "label" + x.toString() + '0';
        d3.select("svg")
            .selectAll("text.dynamic-label")
            .attr("opacity", 0);
    }
    for (let x = 0; x < percentages_left.length; x++){
        class_name = "circle" + x.toString()
        //Move the balls to new positions
        if (level > prev_level){
            //Moving down the tree
            newData = locations[x][level];
            //remove the extra dots
            index = 100 - locations[x][level].length;
            d3.select("svg").selectAll("circle")
                .filter("." + class_name)
                .filter(function (d, i) {return i <= index-1;})
                .transition().duration(900)
                .ease(d3.easePoly.exponent(2))
                .attr('fill', background);
            //move the remaining dots
            d3.select("svg").selectAll("circle")
                .filter("." + class_name)
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
                })
            //Recolor the balls
            d3.select("svg").selectAll("circle")
                .filter("." + class_name)
                .filter(function (d, i) {return i > index-1;})
                .data(newData)
                .transition().delay(2000).duration(900)
                .ease(d3.easePoly.exponent(2))
                .attr("fill", function(d){
                    if (d.color){
                        return colors[x][0]
                    }
                    else {
                        return colors[x][1]
                    }
                });
        }
        if (level < prev_level){
            //Moving up the tree
            //move the circles
            newData = locations[x][level];
            index = 100 - locations[x][level].length
            d3.select("svg").selectAll("circle")
                .filter("." + class_name)
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
                .filter("." + class_name)
                .filter(function (d, i) {return i > index-1;})
                .data(newData)
                .transition().delay(1500).duration(900)
                .attr("fill", function(d){
                    if (d.color){
                        return colors[x][0]
                    }
                    else {
                        return colors[x][1]
                    }
                });
        }
    
    }
    //activate the label
    for (let x = 0; x < percentages_left.length; x++){
        class_name = "label" + x.toString() + level.toString() + dir;
        d3.select("svg")
            .selectAll("text.dynamic-label")
            .filter("." + class_name)
            .transition().delay(1500).duration(500)
            .style("text-anchor", "middle")
            .attr("opacity", 1)
            .attr('font-weight','bold');
    }
    prev_level = level;
}
