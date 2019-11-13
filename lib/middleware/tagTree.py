import networkx as nx
import sys


def read_input(db_as_text):
    """
    Takes the content of a text file specifying the tag tree of the exercise databease Uebomat and turns it into a
    networkx graph. The file has the following format:
    [@node,...,@node] where each node has the format
    {"parentId":["@id",...,"@id"], "subtree_tags":["@name",...,"@name"], "_id":"@id","name":"@name", "__v":0}.
    :param filename: The file containing the tag-tree.
    :return: A networkx graph representing the tree.
    """
    """
    try:
        inputfile = open(filename, 'r')
    except IOError:
        print('ERROR: Could not open \'%s\' for reading!\n' % filename)
        return None
    with inputfile:
        print('Reading network data from file \'%s\'...\n' % filename)
        
        line = inputfile.readline()
        line = line[1:-1]
    """
    tt = nx.Graph()
    id_to_name = {}

    line = db_as_text
    nodes = line.split('},{')
    nodes = [node.replace('{', '') for node in nodes]
    nodes = [node.replace('{', '') for node in nodes]
    nodes = [node.replace('"parentId":', '#') for node in nodes]
    nodes = [node.replace('"subtree_tags":', '#') for node in nodes]
    nodes = [node.replace('"_id":', '#') for node in nodes]
    nodes = [node.replace('"name":', '#') for node in nodes]
    nodes = [node.replace('"__v":', '#') for node in nodes]
    for node in nodes:
        node = node.split('#')[1:-1]
        node_id = node[2][1:-2]
        node_name = node[3][1:-2]
        id_to_name[node_id] = node_name
        tt.add_node(node_name)
        pred = [name[1:-1] for name in node[0][1:-2].split(',')]
        tt.add_edges_from([(id_to_name[p], node_name) for p in pred if p != ''])
    return tt


def draw_tag_tree(tt):
    """
    Takes a networkx graph representing the tag-tree and draws it.
    :param tt: The tag-tree to draw.
    :return: Nothing, but draws the tree tt.
    """
    pass


def save_tag_tree_to_png(tt, filename):
    """
    Takes a networkx graph representing the tag-tree and saves a drawing of it to a png file.
    :param tt: The tag tree to save.
    :param filename:  The name of the resulting png file.
    :return: Nothing, but saves a drawing of tt.
    """
    p = nx.drawing.nx_pydot.to_pydot(tt)
    p.write_png(filename)

if __name__ == '__main__':
    dummy_db = [ 
        { 'parentId': [],
        'subtree_tags': [ 'Mathe', 'Optimierung', 'Algebra', 'Netzwerke' ],
        '_id': '5cb5bead652b891d9c0a728a',
        'name': 'Mathe',
        '__v': 0 
        },
        { 'parentId': [ '5cb5bead652b891d9c0a728a' ],
        'subtree_tags': [ 'Optimierung', 'Netzwerke' ],
        '_id': '5cb5bead652b891d9c0a728b',
        'name': 'Optimierung',
        '__v': 0 
        },
        { 'parentId': [ '5cb5bead652b891d9c0a728a' ],
        'subtree_tags': [ 'Algebra' ],
        '_id': '5cb5bead652b891d9c0a728c',
        'name': 'Algebra',
        '__v': 0 
        }, 
        ]
    print('starting python')
    tt = read_input(dummy_db)
    #tt = read_input(sys.argv[1])
    #save_tag_tree_to_png(tt, 'tagTree')