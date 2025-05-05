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
var prev_dir = "left";

function createLegend(x_pos, y){
    console.log(x_pos)
    console.log(Array.isArray(x_pos));
    const sum = x_pos.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const x = sum / x_pos.length;
    //const x = x_pos => x_pos.reduce((sum, val) => sum + val, 0) / x_pos.length;
    const r = 15;
    //start with random locations
    var data = Array.from({ length: 100}, (_, index) => ({
        x: Math.random() * x - (index * 15),
        y: Math.random() * y - (index * 15),
        r: r
    }));
    //use force simulation to make a circle
    sim = d3.forceSimulation(data)
        .force("x", d3.forceX(x)) 
        .force("y", d3.forceY(y))
        .force("collide", d3.forceCollide(radius+20).iterations(2))
        // ... chain together as many forces as we want
        .stop()
        .tick(35);
        
    // Sort by y-coordinate
    data.sort((a, b) => a.y - b.y);

    //add text locations
    var highest = data[0].y;
    var lowest = data[data.length - 1].y;
    var legend_labels_loc = []
    legend_labels_loc.push([x, highest - 20])
    legend_labels_loc.push([x, lowest + 50])
        
    // Add id and color attributes
    data = data.map((ball, index) => ({
        ...ball,
        color: Boolean(index <= (100 * (1 - 0.8)))
    }));
    const opacity = 0.25
    class_name = "legend"
    var circles = d3.select("svg").selectAll("circle")
        .filter("." + class_name)
        .data(data)
        .enter()
        .append("circle")
        .attr('cx', function(d){
            return d.x;
        })
        .attr('cy', function(d){
            return d.y;
        })
        .attr("r", r)
        .attr("fill", function(d){
            if (d.color){
                return "dimgray";
            }
            else {
                return "gainsboro";
            }
        })
        .attr('opacity', opacity)
        .classed(class_name, true);
    //text labels
    // svg.append('text')
    //     .attr('font-size','24px')
    //     .attr('font-weight','bold')
    //     .attr('x', legend_labels_loc[0][0])
    //     .attr('y', legend_labels_loc[0][1] - 30)
    //     .text('Observed Frequency:')
    //     .attr("text-anchor", "middle")
    //     .attr('fill', 'black')
    //     .attr('opacity', opacity-0.05)
    //     .classed("legend", true); 
    svg.append('text')
        .attr('font-size','24px')
        .attr('font-weight','bold')
        .attr('x', legend_labels_loc[0][0])
        .attr('y', legend_labels_loc[0][1])
        .text('% Without New Mutation')
        .attr("text-anchor", "middle")
        .attr('fill', 'black')
        .attr('opacity', opacity-0.05)
        .classed("legend", true); 
    svg.append('text')
        .attr('font-size','24px')
        .attr('font-weight','bold')
        .attr('x', legend_labels_loc[1][0])
        .attr('y', legend_labels_loc[1][1])
        .text('% With New Mutation')
        .attr("text-anchor", "middle")
        .attr('fill', 'grey')
        .attr('opacity', opacity)
        .classed("legend", true);
    
}


//Initialize balls
function createBalls(arr, x_pos, y_pos, cluster_names, max_levels){    
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
                    p_right = p_left.slice(0,max_levels-1-2); //kinda cheating cause I know there's a difference of 2
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
    
    //make text labels
    var text_labels_l = [];
    var text_labels_r = [];
    for (let x = 0; x < percentages_left.length; x++){
        var curr_string = ''; 
        for (let i = 0; i < cluster_names.length; i++){
            if (percentages_left[x][i] == 1){
                curr_string = curr_string;
                text_labels_l.push([curr_string, '']);
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
    console.log(text_locations)

    //create sample labels
    var min_y = 1000000000;
    for (let i = 0; i < x_pos.length; i++) {
        if (text_locations[i][0][0][1] < min_y){
            min_y = text_locations[i][0][0][1]
        }
        svg.append('text')
            .attr('font-size','15px')
            .attr('font-weight','bold')
            .attr('x', x_pos[i])
            .attr('y', text_locations[i][0][0][1])
            .text('T'+i)
            .attr("text-anchor", "middle")
            .classed("sample-label", true);   
    }
    d3.select("svg")
        .selectAll("text.sample-label")
        .attr('y', min_y - 10)

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
                .attr("font-size", "18px")
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
                .attr("font-size", "18px")
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
    if (level == prev_level && prev_dir === dir){
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
        if (level >= prev_level){
            //Moving down the tree
            newData = locations[x][level];
            //remove the extra dots
            index = 100 - locations[x][level].length;
            d3.select("svg").selectAll("circle")
                .filter("." + class_name)
                .filter(function (d, i) {return i <= index-1;})
                .transition().duration(900)
                .ease(d3.easePoly.exponent(2))
                .attr('fill', background)
                .attr("opacity", 0);
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
                })
                .attr('opacity', 1);
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
                })
                .attr('opacity', 1);
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

    //move the sample labels
    var min_y = 1000000000;
    var max_y = 0;
    for (let i = 0; i < percentages_left.length; i++) {
        //i = sample
        if (text_locations[i][level][0][1] < min_y){
            min_y = text_locations[i][level][0][1]
        }
        if (text_locations[i][level][0][1] > max_y){
            max_y = text_locations[i][level][1][1]
        }
    }
    if (level === 0){min_y = min_y - 10}
    else{min_y = min_y - 20}
    d3.select("svg")
        .selectAll("text.sample-label")
        .transition().delay(1600).duration(1200)
        .attr('y', function(d){
            const y = this.getAttribute("y");
            if (y > min_y){
                return max_y + 20;
            }
            else if (y <= min_y){
                return min_y - 20;
            }
        });
        // .each(function() {
        //     this.parentNode.appendChild(this);
        //   });;

    //reset
    prev_level = level;
    prev_dir = dir;
}
