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
        .attr('class', 'links-group').attr('transform', 'translate(-350, 0)');

    var nodeG = svg.append('g')
        .attr('class', 'nodes-group').attr('transform', 'translate(-350, 0)');

    // Add g's for each leaf
    var nodeEnter = nodeG.selectAll('.node')
        .data(dataset)
        .enter()
        .append('g').attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + (height/max_level) * d.level + ')';
        }).on("click", function (d) {
            this.parentNode.appendChild(this);
            rect = d3.select(this).select('rect');

            if (rect.attr("width") < 225) {
                nodeG.selectAll('.node').each(function(d) {
                    make_small(d3.select(this), max_level);
                });
                make_big(d3.select(this), max_level);
            }
            else {
                make_small(d3.select(this), max_level);
            }
        });

    // Add rects for each g for each leaf
    nodeEnter.append('rect')
        .attr('class', 'node-box')
        .attr('y', function (d) {
            return -35;
        })
        .attr("x", function (d) {
            return -100;
        })
        .attr("width", 200).attr("height", 70)
        .attr("fill", "white").attr("rx", 5)

    // Add title text to each g
    nodeEnter.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-before-edge").attr("dy", -35).attr('class', 'node-title').text(function (d) {
        return (
            "Cluster " + d.cluster + " (" + d.mutations + " Mutations)"
        );
    });

    // Setup gs to hold pre and post expanded visualizations
    var pre_expand = nodeEnter.append('g').attr("class", "g-pre-expand")
    var post_expand = nodeEnter.append('g').attr("class", "g-post-expand").attr("opacity", 0.0).attr('transform', 'translate(0, 25)')

    // Add bar chart of probs to pre expand visualization
    var prob_bars = pre_expand.append('g').attr('transform', 'translate(-60, 35)').attr('fill', '#bbbbbb').attr('stroke', 'black');
    prob_bars.append('rect').attr('class', 'bar').attr("x", 0).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[0]).attr('y', d => -35 * d.avg_obs_freq[0])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 30).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[1]).attr('y', d => -35 * d.avg_obs_freq[1])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 60).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[2]).attr('y', d => -35 * d.avg_obs_freq[2])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 90).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[3]).attr('y', d => -35 * d.avg_obs_freq[3])
    prob_bars.append('line').attr("x1", 0).attr("x2", 120).attr("y1", -35).attr("y2", -35).attr('stroke-width', 2).attr('stroke', 'red');

    // Pie chart setup functions
    pie = d3.pie().value(d => d.count).sort(null);
    arc = d3.arc().innerRadius(0).outerRadius(65);

    function colorForType(type) {
        accents = ["#30a2da", "#fc7f0b", "#fc4f30", "#17becf", "#8cc63e", "#9467bd"];
        accents = d3.scaleOrdinal(accents);
        return type.startsWith("no known") ? "#bbbbbb" : accents(type);
    }

    // Add pie chart of roles to post-expand visualizations
    var role_pie = post_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(-150, 0)')
    role_pie.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'sub-chart-title').text("Roles")
    role_pie.append('g').attr('class', 'pie').selectAll('path').data(d => pie(countTypes(d.roles)))
        .enter().append('path').attr('d', arc).attr('class', 'pie-slice')
        .attr('fill', p => colorForType(p.data.type));
    role_pie.selectAll('path').append('title').text(p => p.data.type + ": " + p.data.count)

    // Add pie chart of types to post-expand visualizations
    var type_pie = post_expand.append('g').attr('class', 'sub-chart')
    type_pie.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'sub-chart-title').text("Types")
    type_pie.append('g').attr('class', 'pie').selectAll('path').data(d => pie(countTypes(d.types)))
        .enter().append('path').attr('d', arc).attr('class', 'pie-slice')
        .attr('fill', p => colorForType(p.data.type));
    type_pie.selectAll('path').append('title').text(p => p.data.type + ": " + p.data.count)

    // Add Anna's balls visualization to post-expand visualizations
    var type_pie = post_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(150, 0)')
    type_pie.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'chart-title').text("Anna's Ball Viz")


    // Add branches
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

function make_big(node, max_level) {
    d = node.datum()
    rect = node.select('rect');
    title = node.select('text');

    node.select('.g-pre-expand').attr("opacity", 0.0);
    node.select('.g-post-expand').transition().attr("opacity", 1.0);

    x = -225
    if (d.x + x <= 0) {
        x = 5 - d.x
    }
    else if (d.x + x + 450 >= width) {
        x = width - 5 - 450 - d.x
    }

    y = -105
    if (((height/max_level) * d.level) + y <= 0) {
        y = 5 - ((height/max_level) * d.level)
    }
    else if (((height/max_level) * d.level) + y + 210 >= height) {
        y = height - 5 - 210 - ((height/max_level) * d.level);
    }

    rect.transition().attr('y', y).attr("x", x).attr("width", 450).attr("height", 210)
    title.transition().attr('dy', y).attr('font-size', '32px')
}

function make_small(node, max_level) {
    d = node.datum()
    rect = node.select('rect');
    title = node.select('text');

    node.select('.g-pre-expand').transition().attr("opacity", 1.0);
    node.select('.g-post-expand').attr("opacity", 0.0);

    rect.transition().attr('y', function (d) {
        return -35;
    })
    .attr("x", function (d) {
        return -100;
    })
    .attr("width", 200).attr("height", 70)
    title.transition().attr('dy', -35).attr('font-size', '16px')
}

function countTypes(types) {
    return Array.from(
        d3.rollup(types, v => v.length, t => t),
        ([type, count]) => ({ type, count })
    );
}