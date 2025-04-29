var svg = d3.select('svg');
var width = +svg.attr('width');
var height = +svg.attr('height');


d3.json('tree.json').then(function(dataset) {
    dataset.sort(function(a, b) {
        return a["parent"] <= b["parent"]
    })

    // Calc x's
    dataset.forEach(node => {
        filtered_list = dataset.filter(x => x["level"] === node["level"]);
        level_size = filtered_list.length + 1;
        node["x"] = (filtered_list.indexOf(node) + 1) * (width/level_size);
    });
    console.log(dataset);

    // Calc y's
    var max_level = 0
    dataset.forEach(node => {
        if (node.level > max_level) {
            max_level = node.level
        }
    });
    max_level += 1;


    var linkG = svg.append('g')
        .attr('class', 'links-group');

    var nodeG = svg.append('g')
        .attr('class', 'nodes-group');

    var nodeEnter = nodeG.selectAll('.node')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('class', 'node')
        .attr('r', 12)
        .attr('y', function (d) {
            return (height/max_level) * (d.level) - 35;
        })
        .attr("x", function (d) {
            return d.x - 75;
        })
        .attr("width", 150).attr("height", 70).on("click", function (d) {
            const clickedElement = d3.select(this)
            this.parentNode.appendChild(this);

            if (clickedElement.attr("width") < 200) {
                make_big(clickedElement, d, max_level);
            }
            else {
                make_small(clickedElement, d, max_level);
            }

        });

    var linkEnter = linkG.selectAll('.link')
        .data(dataset.filter(x => x["level"] > 0))
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 6)
        .attr('y1', function (d) {
            return (height/max_level) * (d.level);
        })
        .attr('x1', function (d) {
            return d.x;
        })
        .attr('x2', function(d) {
            if (d.parent === null) {
                return d.x;
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0]
            return par_d.x;
        })
        .attr('y2', function(d) {
            if (d.parent === null) {
                return (height/max_level) * (d.level);
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0];
            return (height/max_level) * (par_d.level);
        })
})

function make_big(element, d, max_level) {
    if ((height/max_level) * (d.level) - 105 < 0) {
        y = 0;
    }
    else if ((height/max_level) * (d.level) + 105 > height) {
        y = height - 210;
    }
    else {
        y = (height/max_level) * (d.level) - 105
    }

    if (d.x - 225 < 0) {
        x = 0;
    }
    else if (d.x + 225 > width) {
        x = width - 450;
    }
    else {
        x = d.x - 225;
    }

    element.transition().attr('y', y).attr("x", x).attr("width", 450).attr("height", 210)
}

function make_small(element, d, max_level) {
    element.transition().attr('y', function (d) {
        return (height/max_level) * (d.level) - 35;
    })
    .attr("x", function (d) {
        return d.x - 75;
    })
    .attr("width", 150).attr("height", 70)
}